from sqlalchemy.orm import Session
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 100) -> list[dict]:
    chunks = []
    start = 0
    chunk_index = 0
    if chunk_size <= 0:
        raise ValueError("chunk_size must be greater than 0")

    if overlap < 0:
        raise ValueError("overlap must be greater than or equal to 0")

    if overlap >= chunk_size:
        raise ValueError("overlap must be smaller than chunk_size")

    while start < len(text):
        end = start + chunk_size
        content = text[start:end]

        chunks.append({
            "chunk_index": chunk_index,
            "content": content,
            "start_char": start,
            "end_char": min(end, len(text)),
            "token_count": len(content.split())
        })

        chunk_index += 1

        if end >= len(text):
            break

        start = end - overlap

    return chunks

def create_chunks_for_document(db: Session, document_id: int) -> list[DocumentChunk]:
    """
    Creates chunks from document.raw_text and saves them in document_chunks.
    """
    document = db.get(Document, document_id)

    if document is None:
        raise ValueError("Document not found")

    if not document.raw_text:
        raise ValueError("Document has no raw_text yet")

    db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).delete()

    chunks_data = chunk_text(document.raw_text)

    chunks = []

    for chunk_data in chunks_data:
        chunk = DocumentChunk(
            document_id=document_id,
            chunk_index=chunk_data["chunk_index"],
            content=chunk_data["content"],
            start_char=chunk_data["start_char"],
            end_char=chunk_data["end_char"],
            token_count=chunk_data["token_count"],
        )

        db.add(chunk)
        chunks.append(chunk)

    document.status = "chunked"

    db.commit()

    for chunk in chunks:
        db.refresh(chunk)

    return chunks