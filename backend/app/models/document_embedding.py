from datetime import datetime, timezone

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.config import settings
from app.db.base import Base


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True,
    )

    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )

    chunk_id: Mapped[int] = mapped_column(
        ForeignKey("document_chunks.id"),
        index=True,
        unique=True,
        nullable=False,
    )

    embedding: Mapped[list[float]] = mapped_column(
        Vector(settings.embedding_dimension),
        nullable=False,
    )

    embedding_model: Mapped[str] = mapped_column(
        String(255),
        default=settings.embedding_model_name,
        nullable=False,
    )

    embedding_dimension: Mapped[int] = mapped_column(
        Integer,
        default=settings.embedding_dimension,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )