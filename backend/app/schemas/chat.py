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


# --- Global (all-documents) chat ---

class GlobalChatSource(BaseModel):
    document_id: int
    original_filename: str
    chunk_id: int
    chunk_index: int
    similarity: float


class GlobalChatResponse(BaseModel):
    answer: str
    sources: list[GlobalChatSource]
