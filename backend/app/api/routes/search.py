from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchResultResponse
from app.services.search_service import keyword_search, semantic_search, find_similar_docuemnts, define_possible_duplicates

router = APIRouter(prefix="/search", tags=["SEARCH"])

@router.get("/")
def search_status():
    return {"status": "ok"}


@router.get("/keyword", response_model=list[SearchResultResponse])
def keyword_search_route(query: str, limit: int=5, db: Session = Depends(get_db)):
    return keyword_search(db, query, limit=limit)


@router.get("/semantic")
def semantic_search_route(query: str, limit: int=5, db: Session = Depends(get_db)):
    return semantic_search(db, query, limit=limit)


@router.get("/documents/{document_id}/similar")
def search_similar_documents(document_id: int, limit: int = 5, db: Session = Depends(get_db)):
    return find_similar_docuemnts(db, document_id, limit=limit)


@router.get("/documents/{document_id}/duplicates")
def search_duplicated_document(document_id: int, similarity_threshold: float = 0.90, db:Session = Depends(get_db)):
    return define_possible_duplicates(
        db, document_id, similarity_threshold=similarity_threshold
    )