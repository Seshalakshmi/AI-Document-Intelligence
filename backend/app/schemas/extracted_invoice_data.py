from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel, Field


class ExtractedInvoiceDataResponse(BaseModel):
    id: int
    document_id: int

    supplier_name: str | None
    invoice_number: str | None
    invoice_date: date | None

    currency: str | None = Field(default=None, examples=["USD"])
    subtotal: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, examples=[1000.00])
    tax_amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, examples=[80.00])
    total_amount: Decimal | None = Field(default=None, max_digits=12, decimal_places=2, examples=[1080.00])
    payment_terms: str | None = Field(default=None, examples=["Net 30"])

    confidence_score: float | None = Field(default=None, ge=0, le=1, examples=[0.95])

    raw_extraction_json: str | None

    is_reviewed: bool

    reviewed_by_id: int | None
    reviewed_at: datetime | None

    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True