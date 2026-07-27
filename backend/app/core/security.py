from datetime import datetime, timedelta, timezone
 
import bcrypt
import jwt
 
from app.core.config import settings
 
 
def hash_password(password: str) -> str:
    """Hashes a plaintext password with bcrypt. Never store raw passwords."""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
 
 
def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Checks a plaintext password against a bcrypt hash."""
    return bcrypt.checkpw(
        plain_password.encode("utf-8"),
        hashed_password.encode("utf-8"),
    )
 
 
def create_access_token(data: dict, expires_delta: timedelta | None = None) -> str:
    """Creates a signed JWT. `data` should include 'sub' (subject = user id)."""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (
        expires_delta or timedelta(minutes=settings.access_token_expire_minutes)
    )
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)
 
 
def decode_access_token(token: str) -> dict:
    """Decodes and verifies a JWT. Raises jwt.PyJWTError if invalid/expired."""
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])