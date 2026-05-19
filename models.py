from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    line_user_id = Column(String, unique=True, index=True)
    display_name = Column(String)
    picture_url = Column(String, nullable=True) # 大頭貼可能沒有，允許為空
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    # 建立與 Event 的關聯 (這會讓查詢非常方便)
    events = relationship("Event", back_populates="owner")

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String)
    description = Column(String, nullable=True)
    
    start_time = Column(DateTime)
    end_time = Column(DateTime, nullable=True)
    
    is_all_day = Column(Boolean, default=False)
    
    is_completed = Column(Boolean, default=False)   
    
    remind_time = Column(DateTime, nullable=True)
    is_reminded = Column(Boolean, default=False)

    owner = relationship("User", back_populates="events")