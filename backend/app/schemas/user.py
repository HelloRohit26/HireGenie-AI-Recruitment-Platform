from pydantic import EmailStr

from app.schemas.base import BaseSchema, TimestampSchema


class UserCreate(BaseSchema):
    full_name: str
    email: EmailStr
    password: str


class UserResponse(TimestampSchema):
    id: int
    full_name: str
    email: EmailStr
    role: str
    is_active: bool

class UserLogin(BaseSchema):
    email: EmailStr
    password: str