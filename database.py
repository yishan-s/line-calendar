from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# 指定 SQLite 資料庫的檔案名稱為 calendar.db
SQLALCHEMY_DATABASE_URL = "sqlite:///./calendar.db"

# 建立資料庫引擎 (check_same_thread=False 是 SQLite 搭配 FastAPI 時的必備設定)
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)

# 建立與資料庫溝通的 Session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 建立一個 Base 類別，之後我們的資料表都會繼承它
Base = declarative_base()