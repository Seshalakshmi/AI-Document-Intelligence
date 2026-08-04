from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse
from app.services.chat_service import answer_document_question

# Same "/documents" prefix as documents.py -- FastAPI merges routers under
# the same prefix fine, and it keeps the URL exactly where the frontend
# (lib/api.ts -> askDocumentQuestion) already expects it once you wire it up.
router = APIRouter(prefix="/documents", tags=["CHAT"])


@router.post("/{document_id}/chat", response_model=ChatResponse)
def chat_with_document(document_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        return answer_document_question(db, document_id, payload.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
