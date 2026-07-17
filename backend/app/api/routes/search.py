# / search ({message})
# / semantic_search ({message})
# / search_similar_document_id ({message_id})
# / search_duplicated_document ({message_id})
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.document_chunk import DocumentChunk
from app.schemas.search import SearchResultResponse


router = APIRouter(prefix="/search", tags=["SEARCH"])

@router.get("/")
def search_status():
    return {"status": "ok"}


@router.get("/keyword", response_model=list[SearchResultResponse])
def keyword_search(query: str, db: Session = Depends(get_db)):
    chunks = db.query(DocumentChunk).filter(
    DocumentChunk.content.ilike(f"%{query}%")
    ).order_by(DocumentChunk.document_id, DocumentChunk.chunk_index).all()

    return [
        {
            "document_id": chunk.document_id,
            "chunk_id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
        }
        for chunk in chunks
    ]


@router.get("/semantic")
def semantic_search(query: str):
    return {"query": query}


@router.get("/documents/{document_id}/similar")
def search_similar_documents(document_id: int):
    return {"document_id": document_id}


@router.get("/{document_id}")
def search_duplicated_document(document_id: int):
    return {
        "status": "ok",
        "message": "search duplicated document"
    }