from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.chat import ChatRequest, ChatResponse, GlobalChatResponse
from app.services.chat_service import answer_document_question, answer_global_question

# Same "/documents" prefix as documents.py -- FastAPI merges routers under
# the same prefix fine, and it keeps the URL exactly where the frontend
# (lib/api.ts -> askDocumentQuestion) already expects it.
router = APIRouter(prefix="/documents", tags=["CHAT"])


@router.post("/{document_id}/chat", response_model=ChatResponse)
def chat_with_document(document_id: int, payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        return answer_document_question(db, document_id, payload.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# Separate router (no "/documents" prefix) -- this is chat across the WHOLE
# document library, not any one document, so it lives at its own top-level
# path: POST /api/chat
global_router = APIRouter(prefix="/chat", tags=["CHAT"])


@global_router.post("", response_model=GlobalChatResponse)
def chat_across_documents(payload: ChatRequest, db: Session = Depends(get_db)):
    try:
        return answer_global_question(db, payload.question)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
