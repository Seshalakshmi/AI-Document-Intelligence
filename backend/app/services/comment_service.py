from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_comment import DocumentComment
from app.models.user import Users
from app.schemas.document_comment import CommentAuthor, DocumentCommentResponse


def _to_response(comment: DocumentComment, author: Users) -> DocumentCommentResponse:
    return DocumentCommentResponse(
        id=comment.id,
        document_id=comment.document_id,
        user_id=comment.user_id,
        content=comment.content,
        created_at=comment.created_at,
        updated_at=comment.updated_at,
        author=CommentAuthor(id=author.id, fullname=author.fullname),
    )


def get_comments_for_document(db: Session, document_id: int) -> list[DocumentCommentResponse]:
    """Oldest first, like a chat thread. Raises ValueError if the document
    doesn't exist so the route can turn that into a 404."""
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ValueError(f"Document {document_id} not found.")

    rows = (
        db.query(DocumentComment, Users)
        .join(Users, Users.id == DocumentComment.user_id)
        .filter(DocumentComment.document_id == document_id)
        .order_by(DocumentComment.created_at.asc())
        .all()
    )

    return [_to_response(comment, author) for comment, author in rows]


def create_comment(
    db: Session, document_id: int, user: Users, content: str
) -> DocumentCommentResponse:
    document = db.query(Document).filter(Document.id == document_id).first()
    if not document:
        raise ValueError(f"Document {document_id} not found.")

    comment = DocumentComment(
        document_id=document_id,
        user_id=user.id,
        content=content.strip(),
    )

    db.add(comment)
    db.commit()
    db.refresh(comment)

    return _to_response(comment, user)
