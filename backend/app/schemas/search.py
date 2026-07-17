from pydantic import BaseModel


class SearchResultResponse(BaseModel):
    document_id: int
    chunk_id: int
    chunk_index: int
    content: str

    class Config:
        from_attributes = True