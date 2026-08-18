from datetime import datetime

from pydantic import BaseModel, Field


class DocumentCommentCreate(BaseModel):
    content: str = Field(min_length=1, max_length=4000)


class CommentAuthor(BaseModel):
    id: int
    fullname: str

    class Config:
        from_attributes = True


class DocumentCommentResponse(BaseModel):
    id: int
    document_id: int
    user_id: int
    content: str
    created_at: datetime
    updated_at: datetime
    author: CommentAuthor

    class Config:
        from_attributes = True
