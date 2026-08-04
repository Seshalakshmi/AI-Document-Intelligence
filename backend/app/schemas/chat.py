from pydantic import BaseModel


class ChatRequest(BaseModel):
    question: str


class ChatSource(BaseModel):
    chunk_id: int
    chunk_index: int
    similarity: float


class ChatResponse(BaseModel):
    answer: str
    sources: list[ChatSource]
