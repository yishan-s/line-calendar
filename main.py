from fastapi import FastAPI
app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Hello World! backend is working!"}

@app.get("/login/line")
def line_login():
    return {"message": "leading to authenticate"}

@app.get("/callback/line")
def line_callback(code: str):
    return {"message": f"received code from line: {code}"}
