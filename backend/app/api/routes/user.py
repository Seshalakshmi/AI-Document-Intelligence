from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.user import Users

router = APIRouter(prefix="/users", tags=["USER"])


@router.get("/")
def get_users(db: Session = Depends(get_db)):
    users = db.query(Users).all()

    if not users:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return users


@router.post("/")
def create_user(user: dict = Body(...), db: Session = Depends(get_db)):
    try:
        existing_user = db.query(Users).filter(Users.email == user["email"]).first()
        
        if existing_user:
                raise HTTPException(status_code=400,detail="User email already exists.")
        
        is_admin = False
        if user["role"] == "admin":
            is_admin = True
        
        new_user = Users(
            fullname=user["fullname"],
            email=user["email"],
            password_hash=user["password_hash"],
            role=user["role"],
            is_admin=is_admin
        )

        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        return {
            "message": "User successfully created",
            "user": new_user
        }
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{user_id}")
def get_user_by_id(user_id:int, db: Session = Depends(get_db)):
    user = db.query(Users).filter(Users.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return user
        

@router.put("/{user_id}")
def update_user(user_id:int, update_user: dict = Body(...), db: Session = Depends(get_db)):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="No users found.")
        
        user.fullname = update_user.get("fullname", user.fullname)
        user.email=update_user.get("email", user.email)
        user.password_hash=update_user.get("password_hash", user.password_hash)
        user.role=update_user.get("role", user.role)
        user.is_active=update_user.get("is_active", user.is_active)
        user.is_admin=update_user.get("is_admin", user.is_admin)

        db.commit()
        db.refresh(user)

        return {
            "message": "User has been updated",
            "user": user
        }
    
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

    
@router.delete("/{user_id}")
def delete_user(user_id:int, db: Session = Depends(get_db)):
    try:
        user = db.query(Users).filter(Users.id == user_id).first()

        if not user:
            raise HTTPException(status_code=404, detail="No users found.")
        
        db.delete(user)
        db.commit()

        return {
            "message": "User deleted successfully"
        }

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
