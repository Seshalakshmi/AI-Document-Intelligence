from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, Text, DateTime
from datetime import datetime, timezone


def utc_now():
    return datetime.now(timezone.utc)


class DocumentComment(Base):
    """
    A single comment on a document -- this is the human discussion thread
    (e.g. "the total on page 2 wasn't picked up"), separate from the AI
    chat/Q&A feature in chat_service.py. Everyone viewing the document sees
    the same thread, each comment tagged with its author.
    """

    __tablename__ = "document_comments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"),
        index=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"),
        index=True,
    )

    content: Mapped[str] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
