from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
 
from app.db.database import get_db
from app.models.user import Users
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.core.security import hash_password
from app.services.user_service import (
    create_user,
    get_current_active_user,
    get_current_admin_user,
)
 
router = APIRouter(prefix="/users", tags=["USER"])
 
 
@router.post("/register", response_model=UserResponse, status_code=201)
def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    """Public registration endpoint. Password is hashed before storage;
    is_admin is derived from role, never accepted directly from the client."""
    return create_user(db, user_in)
 
 
@router.get("/me", response_model=UserResponse)
def read_current_user(current_user: Users = Depends(get_current_active_user)):
    return current_user
 
 
@router.get("/", response_model=list[UserResponse])
def get_users(
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_admin_user),
):
    return db.query(Users).all()
 
 
@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user),
):
    if current_user.id != user_id and not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized to view this user.")
 
    user = db.query(Users).filter(Users.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
 
    return user
 
 
@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: int,
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user),
):
    try:
        if current_user.id != user_id and not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Not authorized to update this user.")
 
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
 
        if update_data.fullname is not None:
            user.fullname = update_data.fullname
 
        if update_data.email is not None:
            existing = db.query(Users).filter(
                Users.email == update_data.email, Users.id != user_id
            ).first()
            if existing:
                raise HTTPException(status_code=400, detail="Email already in use.")
            user.email = update_data.email
 
        if update_data.password is not None:
            user.password_hash = hash_password(update_data.password)
 
        # Role and active-status changes are privileged, even for a user
        # editing their own profile -- otherwise anyone could self-promote.
        if update_data.role is not None:
            if not current_user.is_admin:
                raise HTTPException(status_code=403, detail="Only admins can change role.")
            user.role = update_data.role.value
            user.is_admin = (update_data.role.value == "admin")
 
        if update_data.is_active is not None:
            if not current_user.is_admin:
                raise HTTPException(status_code=403, detail="Only admins can change active status.")
            user.is_active = update_data.is_active
 
        db.commit()
        db.refresh(user)
        return user
 
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
 
 
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_admin_user),
):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found.")
 
        db.delete(user)
        db.commit()
        return {"message": "User deleted successfully"}
 
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))