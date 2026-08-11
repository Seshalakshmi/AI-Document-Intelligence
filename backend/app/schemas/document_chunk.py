from datetime import datetime

from pydantic import BaseModel


class InvoiceParty(BaseModel):
    name: str | None = None
    city: str | None = None
    state: str | None = None
    country: str | None = None


class InvoiceItem(BaseModel):
    name: str | None = None
    quantity: int | float | str | None = None
    rate: str | None = None
    amount: str | None = None


class InvoiceTotals(BaseModel):
    subtotal: str | None = None
    discount: str | None = None
    shipping: str | None = None
    total: str | None = None


class InvoiceStructuredData(BaseModel):
    invoice_number: str | None = None
    company: str | None = None
    bill_to: InvoiceParty | None = None
    ship_to: InvoiceParty | None = None
    date: str | None = None
    ship_mode: str | None = None
    balance_due: str | None = None
    items: list[InvoiceItem] | None = None
    totals: InvoiceTotals | None = None
    notes: str | None = None
    terms: str | None = None
    order_id: str | None = None


class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    start_char: int | None
    end_char: int | None
    token_count: int | None
    created_at: datetime
    document_type: str | None = None
    structured_data: InvoiceStructuredData | None = None

    class Config:
        from_attributes = True
