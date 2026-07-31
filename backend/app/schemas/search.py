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