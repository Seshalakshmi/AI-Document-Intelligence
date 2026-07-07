from enum import Enum
from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, Text, DateTime, String
from datetime import datetime, timezone

# class DocumentChunk(Base):
#     __tablename__ = "document_chunks"

#     id: Mapped[int] = mapped_column(Integer, Primary_key = True, index=True)
#     document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)
#     chunk_index: Mapped[int] = mapped_column(Integer)
#     content: Mapped[str] = mapped_column(Text)

#     start_char: Mapped[int | None] = mapped_column(Integer, nullable=True)
#     end_char: Mapped[int | None] = mapped_column(Integer, nullable=True)
#     token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

#     created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

def utc_now():
    return datetime.now(timezone.utc)


class ChunkType(str, Enum):
    raw_text = "raw_text"
    invoice_facts = "invoice_facts"


class DocumentChunk(Base):
    tablename = "document_chunks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
    )

    chunk_index: Mapped[int] = mapped_column(Integer)
    chunk_type: Mapped[str] = mapped_column(String(50), default=ChunkType.raw_text.value)

    content: Mapped[str] = mapped_column(Text)

    start_char: Mapped[int | None] = mapped_column(Integer, nullable=True)
    end_char: Mapped[int | None] = mapped_column(Integer, nullable=True)

    token_count: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
