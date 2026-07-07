from app.db.database import Base
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy import String, ForeignKey, Text, Float, DateTime
from datetime import datetime, timezone

class ExtractedData(Base):
    __tablename__ = "extracted_data"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    document_id: Mapped[int] = mapped_column(ForeignKey("documents.id"), index=True)

    # field_name: Mapped[str] = mapped_column(String(100))
    # field_value: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
