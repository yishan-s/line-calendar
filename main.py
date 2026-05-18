import os
from datetime import datetime, timedelta, timezone
from typing import Optional
import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Cookie
from fastapi.responses import RedirectResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from sqlalchemy.orm import Session
import models
from database import SessionLocal, engine

# ==========================================
# Initialization and Env Setting
# ==========================================
load_dotenv()

app = FastAPI(title="LINE 數位手帳 API")
app.mount("/static", StaticFiles(directory="static"), name="static")

# 確保資料表在啟動時自動建立
models.Base.metadata.create_all(bind=engine)

# LINE 憑證設定
CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
LINE_API_URL = "https://api.line.me/v2/bot/message/push"
LINE_LOGIN_CHANNEL_ID = os.getenv("LINE_LOGIN_CHANNEL_ID")
LINE_LOGIN_CHANNEL_SECRET = os.getenv("LINE_LOGIN_CHANNEL_SECRET")
CALLBACK_URL = "http://127.0.0.1:8000/callback/line"


# ==========================================
# Dependencies and Pydantic models
# ==========================================
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

class EventCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None
    is_all_day: Optional[bool] = False
    remind_time: Optional[datetime] = None


# ==========================================
# FastAPI API Routes
# ==========================================

# root
@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")


# LINE auth
@app.get("/login/line")
def line_login():
    auth_url = (
        f"https://access.line.me/oauth2/v2.1/authorize?"
        f"response_type=code&"
        f"client_id={LINE_LOGIN_CHANNEL_ID}&"
        f"redirect_uri={CALLBACK_URL}&"
        f"state=12345abcde&"
        f"scope=profile%20openid"
    )
    return RedirectResponse(url=auth_url)

# Updating user list
@app.get("/callback/line")
async def line_callback(code: str, state: str, db: Session = Depends(get_db)):
    token_url = "https://api.line.me/oauth2/v2.1/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": CALLBACK_URL,
        "client_id": LINE_LOGIN_CHANNEL_ID,
        "client_secret": LINE_LOGIN_CHANNEL_SECRET,
    }

    async with httpx.AsyncClient() as client:
        # 1. 換取 Access Token
        token_res = await client.post(token_url, data=token_data)
        if token_res.status_code != 200:
            return {"error": "NOT RECEIVED Token", "detail": token_res.text}

        access_token = token_res.json().get("access_token")

        # 2. 獲取使用者 Profile
        profile_url = "https://api.line.me/v2/profile"
        headers = {"Authorization": f"Bearer {access_token}"}
        profile_res = await client.get(profile_url, headers=headers)
        if profile_res.status_code != 200:
            return {"error": "NOT RECEIVED Profile", "detail": profile_res.text}

        profile_json = profile_res.json()
        line_user_id = profile_json.get("userId")

        # 3. 檢查資料庫並自動儲存
        db_user = (
            db.query(models.User)
            .filter(models.User.line_user_id == line_user_id)
            .first()
        )
        if not db_user:
            db_user = models.User(
                line_user_id=line_user_id,
                display_name=profile_json.get("displayName"),
                picture_url=profile_json.get("pictureUrl"),
            )
            db.add(db_user)
            db.commit()
            db.refresh(db_user)
    response = RedirectResponse(url="/")
    response.set_cookie(key="current_user_id", value=str(db_user.id), max_age=2592000, path="/")

    return response

# 新增行程
@app.post("/events")
def create_event(event: EventCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == event.user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User Not Found")

    new_event = models.Event(
        user_id=event.user_id,
        title=event.title,
        description=event.description,
        start_time=event.start_time,
        end_time=event.end_time,
        is_all_day=event.is_all_day,
        remind_time=event.remind_time,
        is_completed=False,
    )
    db.add(new_event)
    db.commit()
    db.refresh(new_event)
    return {"message": "Event Created", "event": new_event}


# get {user_id} all events (for frontend)
@app.get("/users/{user_id}/events")
def get_user_events(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="USER Not Found")

    user_events = (
        db.query(models.Event).filter(models.Event.user_id == user_id).all()
    )
    return user_events

# Get current user
@app.get("/users/me")
def get_current_user(current_user_id: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if not current_user_id:
        raise HTTPException(status_code=401, detail="尚未登入")
    
    user = db.query(models.User).filter(models.User.id == int(current_user_id)).first()
    if not user:
        raise HTTPException(status_code=404, detail="找不到使用者")
        
    return user


# [debugging] get_all_users
@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()


# [debugging] get_all_events
@app.get("/test-events")
def get_all_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all()


# ==========================================
# Background scheduling
# ==========================================
def check_and_send_reminders():
    db = SessionLocal()
    try:
        # 轉換為台灣時間進行資料庫比對
        tw_tz = timezone(timedelta(hours=8))
        now = datetime.now(tw_tz).replace(tzinfo=None)

        upcoming_events = (
            db.query(models.Event)
            .filter(
                models.Event.remind_time != None,
                models.Event.remind_time <= now,
                models.Event.is_reminded == False,
            )
            .all()
        )

        for event in upcoming_events:
            line_id = event.owner.line_user_id

            if line_id and CHANNEL_ACCESS_TOKEN:
                reminder_text = f"【{event.title}】\n即將在 {event.start_time.strftime('%Y-%m-%d %H:%M')} 開始ㄌ！"

                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {CHANNEL_ACCESS_TOKEN}",
                }
                data = {
                    "to": line_id,
                    "messages": [{"type": "text", "text": reminder_text}],
                }

                with httpx.Client() as client:
                    res = client.post(LINE_API_URL, headers=headers, json=data)

                    if res.status_code == 200:
                        event.is_reminded = True
                        db.commit()
                        print(
                            f"成功發送提醒給 {event.owner.display_name}：{event.title}"
                        )
                    else:
                        print(f"發送失敗，LINE 回傳：{res.text}")

    except Exception as e:
        print(f"排程檢查發生錯誤: {e}")
    finally:
        db.close()


scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_reminders, "interval", seconds=30)
scheduler.start()