from pydantic import BaseModel, EmailStr, Field

from app.models import UserRole


class AdminUserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.user
    phone_number: str | None = Field(default=None, max_length=64)
    city: str | None = Field(default=None, max_length=128)
    country: str | None = Field(default=None, max_length=128)


class AdminUserUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    email: EmailStr | None = None
    role: UserRole | None = None
    is_suspended: bool | None = None
    phone_number: str | None = Field(default=None, max_length=64)
    city: str | None = Field(default=None, max_length=128)
    country: str | None = Field(default=None, max_length=128)
