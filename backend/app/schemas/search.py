from pydantic import BaseModel


class SearchResultResponse(BaseModel):
    document_id: int
    chunk_id: int

    chunk_index: int | None = None
    original_filename: str

    content: str

    similarity: float | None = None
    score: float | None = None
    match_type: str | None = None

    invoice_date: str | None = None
    total_amount: float | None = None
    currency: str | None = None
    confidence_score: float | None = None
    supplier_name: str | None = None
    invoice_number: str | None = None