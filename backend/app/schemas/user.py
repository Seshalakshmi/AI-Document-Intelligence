from datetime import datetime
from enum import Enum
 
from pydantic import BaseModel, EmailStr, Field
 
 
class UserRole(str, Enum):
    admin = "admin"
    user = "user"
    reviewer = "reviewer"
 
 
class UserCreate(BaseModel):
    fullname: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: UserRole = UserRole.user
 
 
class UserUpdate(BaseModel):
    """All fields optional -- only provided fields are changed.
    Role and is_active can only be changed by an admin (enforced in the route)."""
    fullname: str | None = Field(default=None, min_length=1, max_length=100)
    email: EmailStr | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)
    role: UserRole | None = None
    is_active: bool | None = None
 
 
class UserResponse(BaseModel):
    id: int
    fullname: str
    email: EmailStr
    role: str
    is_active: bool
    is_admin: bool
    created_at: datetime
 
    class Config:
        from_attributes = True
 
 
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"