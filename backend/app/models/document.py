from enum import Enum
from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, Text, ForeignKey, DateTime, Integer
from datetime import datetime, timezone

class DocumentStatus(str, Enum):
    uploaded: str = "uploaded"
    text_extracted: str = "text_extracted"
    chunked: str = "chunked"
    vectorized: str = "vectorized"
    failed: str = "failed"


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    original_filename: Mapped[str] = mapped_column(String(255))
    stored_filename: Mapped[str] = mapped_column(String(255), unique=True)
    file_path: Mapped[str] = mapped_column(String(500))
    file_type: Mapped[str] = mapped_column(String(50))
    file_size: Mapped[int | None] = mapped_column(Integer, nullable=True) 

    file_hash: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)
    text_hash: Mapped[str | None] = mapped_column(String(128), index=True, nullable=True)

    status: Mapped[str] = mapped_column(String(50), default=DocumentStatus.uploaded.value)
    # This is for future
    # doument_type: Mapped[str] = mapped_column(String(100))

    raw_text: Mapped[str | None] = mapped_column(Text, nullable=True)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # error_message: Mapped[str | None] = mapped_column(Text, nullable=True)

    uploaded_by_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))