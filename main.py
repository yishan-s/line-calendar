from sqlalchemy.orm import Session
import models
import os
import httpx
from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI, HTTPException, Depends
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
import models
from database import engine, SessionLocal
from dotenv import load_dotenv
from datetime import datetime, timezone, timedelta
from typing import Optional

load_dotenv()
app = FastAPI()
models.Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal() # 1. 申請一把臨時鑰匙打開連線
    try:
        yield db        # 2. 把鑰匙交給需要的路由去辦事 (yield 是一個 Python 特性，代表「暫停在這裡，等別人用完」)
    finally:
        db.close()      # 3. 辦完事，不管成功或失敗，都把連線關閉

CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
LINE_API_URL = "https://api.line.me/v2/bot/message/push"

LINE_LOGIN_CHANNEL_ID = os.getenv("LINE_LOGIN_CHANNEL_ID")
LINE_LOGIN_CHANNEL_SECRET = os.getenv("LINE_LOGIN_CHANNEL_SECRET")
CALLBACK_URL = "http://127.0.0.1:8000/callback/line"

class TestMessage(BaseModel):
    user_id: str
    text: str

class EventCreate(BaseModel):
    user_id: int
    title: str
    description: Optional[str] = None
    start_time: datetime
    end_time: Optional[datetime] = None    
    is_all_day: Optional[bool] = False     
    remind_time: Optional[datetime] = None

@app.get("/")
def read_root():
    return {"message": "Hello World! backend is working!"}

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

@app.get("/callback/line")
async def line_callback(code: str, state: str, db: Session = Depends(get_db)):
    # 用 code 換取 Access Token
    token_url = "https://api.line.me/oauth2/v2.1/token"
    token_data = {
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": CALLBACK_URL,
        "client_id": LINE_LOGIN_CHANNEL_ID,
        "client_secret": LINE_LOGIN_CHANNEL_SECRET
    }
    
    async with httpx.AsyncClient() as client:
        # POST 請求換取 Token
        token_res = await client.post(token_url, data=token_data)
        if token_res.status_code != 200:
            return {"error": "NOT RECEIVED Token", "detail": token_res.text}
        
        token_json = token_res.json()
        access_token = token_json.get("access_token")

        # 用 Access Token 取得使用者的 Profile
        profile_url = "https://api.line.me/v2/profile"
        headers = {"Authorization": f"Bearer {access_token}"}
        
        # GET profile
        profile_res = await client.get(profile_url, headers=headers)
        if profile_res.status_code != 200:
            return {"error": "NOT RECEIVED Profile", "detail": profile_res.text}
            
        profile_json = profile_res.json()
        # print(profile_json)

        db_user = db.query(models.User).filter(models.User.line_user_id == profile_json.get("userId")).first()
        if not db_user:
            # create a new User 
            new_user = models.User(
                line_user_id=profile_json.get("userId"),
                display_name=profile_json.get("displayName"),
                picture_url=profile_json.get("pictureUrl")
            )
            db.add(new_user)
            db.commit()
    # received data, then print it out
    return {
        "message": "Login Success!",
        "user_name": profile_json.get("displayName"),
        "user_id": profile_json.get("userId"),
        "picture_url": profile_json.get("pictureUrl")
    }

@app.post("/send-test")
async def send_test_message(payload: TestMessage):
    if not CHANNEL_ACCESS_TOKEN:
        raise HTTPException(status_code=500, detail="找不到 LINE_CHANNEL_ACCESS_TOKEN")

    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {CHANNEL_ACCESS_TOKEN}"
    }
    
    data = {
        "to": payload.user_id,
        "messages": [
            {
                "type": "text",
                "text": payload.text
            }
        ]
    }

    async with httpx.AsyncClient() as client:
        response = await client.post(LINE_API_URL, headers=headers, json=data)
        
    if response.status_code == 200:
        return {"status": "success", "message": "訊息發送成功！"}
    else:
        return {
            "status": "failed", 
            "error_code": response.status_code, 
            "detail": response.text
        }
    
# get all USERs
@app.get("/users")
def get_all_users(db: Session = Depends(get_db)):
    all_users = db.query(models.User).all()
    return all_users

@app.get("/test-events")
def get_all_events(db: Session = Depends(get_db)):
    return db.query(models.Event).all()

# create an event
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
        is_completed=False               
    )
    
    db.add(new_event)
    db.commit()
    
    db.refresh(new_event)
    
    return {"message": "Event Created", "event": new_event}

def check_and_send_reminders():
    # 1. 因為這不是 API 路由，我們必須自己手動開資料庫大門
    db = SessionLocal()
    try:
        # 建立台灣時區
        tw_tz = timezone(timedelta(hours=8))
        now = datetime.now(tw_tz).replace(tzinfo=None)
        upcoming_events = db.query(models.Event).filter(
            models.Event.remind_time != None,
            models.Event.remind_time <= now,
            models.Event.is_reminded == False
        ).all()
        
        # 3. 如果有找到行程，就用迴圈一筆一筆處理
        for event in upcoming_events:
            # 透過 ORM 關係，直接拿到這個行程擁有者的 LINE ID
            line_id = event.owner.line_user_id
            
            if line_id and CHANNEL_ACCESS_TOKEN:
                # 組裝要傳給 LINE 的內文
                reminder_text = f"【{event.title}】\n即將在 {event.start_time.strftime('%Y-%m-%d %H:%M')} 開始ㄌ！"
                
                headers = {
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {CHANNEL_ACCESS_TOKEN}"
                }
                data = {
                    "to": line_id,
                    "messages": [{"type": "text", "text": reminder_text}]
                }
                
                # 4. 在背景發送 HTTP 請求給 LINE 伺服器
                with httpx.Client() as client:
                    res = client.post(LINE_API_URL, headers=headers, json=data)
                    
                    # 如果 LINE 成功接收，我們就改寫資料庫狀態
                    if res.status_code == 200:
                        event.is_reminded = True
                        db.commit() # 5. 確認改寫，鎖上金庫
                        print(f"成功發送提醒給 {event.owner.display_name}：{event.title}")
                    else:
                        print(f"發送失敗，LINE 回傳：{res.text}")
                        
    except Exception as e:
        print(f"排程檢查發生錯誤: {e}")
    finally:
        db.close() # 6. 無論如何，最後一定要把資料庫連線關掉！

scheduler = BackgroundScheduler()
scheduler.add_job(check_and_send_reminders, 'interval', minutes=0.5)
scheduler.start()