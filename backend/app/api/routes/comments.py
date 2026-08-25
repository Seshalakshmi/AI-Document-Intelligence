from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.user import Users
from app.schemas.document_comment import DocumentCommentCreate, DocumentCommentResponse
from app.services.comment_service import create_comment, get_comments_for_document
from app.services.user_service import get_current_active_user


router = APIRouter(prefix="/documents", tags=["COMMENTS"])


@router.get("/{document_id}/comments", response_model=list[DocumentCommentResponse])
def list_comments(document_id: int, db: Session = Depends(get_db)):
    try:
        return get_comments_for_document(db, document_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/{document_id}/comments", response_model=DocumentCommentResponse, status_code=201)
def post_comment(
    document_id: int,
    payload: DocumentCommentCreate,
    db: Session = Depends(get_db),
    current_user: Users = Depends(get_current_active_user),
):
    """Posting requires login so every comment is attributable to a real
    user -- that's the whole point of the name + icon next to each line."""
    try:
        return create_comment(db, document_id, current_user, payload.content)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
