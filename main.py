import os
import httpx
from fastapi import FastAPI, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()
app = FastAPI()

CHANNEL_ACCESS_TOKEN = os.getenv("LINE_CHANNEL_ACCESS_TOKEN")
LINE_API_URL = "https://api.line.me/v2/bot/message/push"

LINE_LOGIN_CHANNEL_ID = os.getenv("LINE_LOGIN_CHANNEL_ID")
LINE_LOGIN_CHANNEL_SECRET = os.getenv("LINE_LOGIN_CHANNEL_SECRET")
CALLBACK_URL = "https://127.0.0.1:8000/callback/line"

class TestMessage(BaseModel):
    user_id: str
    text: str

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
async def line_callback(code: str, state: str):
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