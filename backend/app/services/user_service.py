from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt
 
from app.db.database import get_db
from app.models.user import Users
from app.schemas.user import UserCreate
from app.core.security import hash_password, verify_password, decode_access_token
 
# tokenUrl points Swagger's "Authorize" button at the login endpoint below.
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")
 
 
def create_user(db: Session, user_in: UserCreate) -> Users:
    existing_user = db.query(Users).filter(Users.email == user_in.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
 
    new_user = Users(
        fullname=user_in.fullname,
        email=user_in.email,
        password_hash=hash_password(user_in.password),
        role=user_in.role.value,
        is_admin=(user_in.role == "admin"),
    )
 
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user
 
 
def authenticate_user(db: Session, email: str, password: str) -> Users:
    """Verifies email + password. Raises 401 on any failure -- deliberately
    the same error for 'no such user' and 'wrong password' so login can't
    be used to enumerate registered emails."""
    user = db.query(Users).filter(Users.email == email).first()
 
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
 
    if not user.is_active:
        raise HTTPException(status_code=403, detail="This account has been disabled.")
 
    return user
 
 
def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Users:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )
 
    try:
        payload = decode_access_token(token)
        user_id = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except jwt.PyJWTError:
        raise credentials_exception
 
    user = db.query(Users).filter(Users.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
 
    return user
 
 
def get_current_active_user(current_user: Users = Depends(get_current_user)) -> Users:
    if not current_user.is_active:
        raise HTTPException(status_code=403, detail="This account has been disabled.")
    return current_user
 
 
def get_current_admin_user(current_user: Users = Depends(get_current_active_user)) -> Users:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return current_user