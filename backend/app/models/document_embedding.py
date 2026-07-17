from app.db.base import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import Integer, ForeignKey, String, DateTime
from pgvector.sqlalchemy import Vector
import os
from datetime import datetime, timezone


def utc_now():
    return datetime.now(timezone.utc)


class DocumentEmbedding(Base):
    __tablename__ = "document_embeddings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"),
        index=True)
    
    chunk_id: Mapped[int] = mapped_column(ForeignKey("document_chunks.id"),
        index=True, unique=True)
    
    embedding: Mapped[list[float]] = mapped_column(Vector(int(os.getenv("EMBEDDING_DIMENSION", "384"))))

    embedding_model: Mapped[str] = mapped_column(String(255), default=os.getenv("EMBEDDING_MODEL_NAME"))

    embedding_dimension: Mapped[int] = mapped_column(Integer, default=os.getenv("EMBEDDING_DIMENSION"))

    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
