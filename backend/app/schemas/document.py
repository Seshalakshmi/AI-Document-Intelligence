# create modals
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: int
    original_filename: str
    stored_filename: str
    file_path: str
    file_type: str
    file_size: int | None
    status: str
    raw_text: str | None
    description: str | None
    # error_type: str | None
    # document_type: str | None
    created_at: datetime

    class Config:
        from_attributes = True