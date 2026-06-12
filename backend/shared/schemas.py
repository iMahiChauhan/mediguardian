from pydantic import BaseModel, EmailStr
from typing import Optional, List
import datetime

# Auth Schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# History Schemas
class HistoryCreate(BaseModel):
    user_id: int
    symptoms_text: str
    top_condition_name: str
    severity: str
    is_emergency: bool

class HistoryResponse(BaseModel):
    id: int
    user_id: int
    symptoms_text: str
    top_condition_name: str
    severity: str
    is_emergency: bool
    created_at: datetime.datetime

    class Config:
        from_attributes = True
