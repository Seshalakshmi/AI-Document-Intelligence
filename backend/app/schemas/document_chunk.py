from datetime import datetime

from pydantic import BaseModel


class DocumentChunkResponse(BaseModel):
    id: int
    document_id: int
    chunk_index: int
    content: str
    start_char: int | None
    end_char: int | None
    token_count: int | None
    created_at: datetime

    class Config:
        from_attributes = True