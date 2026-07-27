from fastapi import APIRouter, Depends
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.user import Token
from app.services.user_service import authenticate_user
from app.core.security import create_access_token


router = APIRouter(prefix="/auth", tags=["AUTH"])

@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> Token:
    """
    OAuth2 password flow. In Swagger, use the 'Authorize' button and put
    the user's email in the 'username' field -- OAuth2PasswordRequestForm
    always calls it 'username' regardless of what it actually holds.
    """
    user = authenticate_user(db, form_data.username, form_data.password)
    access_token = create_access_token(data={"sub": str(user.id)})
    return Token(access_token=access_token)