from datetime import datetime, date
from decimal import Decimal
from pydantic import BaseModel


class ExtractedDataResponce(BaseModel):
    id: int
    document_id: int

    supplier_name: str | None
    invoice_number: str | None
    invoice_date: date | None

    currency: str | None
    subtotal: Decimal | None
    tax_amount: Decimal | None
    total_amount: Decimal | None
    payment_terms: str | None

    confidence_score: float | None

    raw_extraction_json: str | None

    is_reviewed: bool

    created_at: datetime
    updated_at: datetime