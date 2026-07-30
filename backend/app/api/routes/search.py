from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.search import SearchResultResponse
from app.services.search_service import keyword_search, semantic_search, hybrid_search, search_invoices, find_similar_docuemnts, detect_possible_duplicates
from datetime import date

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

@router.get("/hybrid")
def hybrid_search(query: str, limit: int = 5, db: Session = Depends(get_db)):
    return hybrid_search(db, query, limit=limit)
 
 
@router.get("/invoices")
def search_invoices(
    supplier_name: str | None = None,
    invoice_number: str | None = None,
    currency: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    min_total_amount: float | None = None,
    max_total_amount: float | None = None,
    is_reviewed: bool | None = None,
    min_confidence: float | None = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    return search_invoices(
        db,
        supplier_name=supplier_name,
        invoice_number=invoice_number,
        currency=currency,
        date_from=date_from,
        date_to=date_to,
        min_total_amount=min_total_amount,
        max_total_amount=max_total_amount,
        is_reviewed=is_reviewed,
        min_confidence=min_confidence,
        limit=limit,
        offset=offset,
    )


@router.get("/documents/{document_id}/similar")
def search_similar_documents(document_id: int, limit: int = 5, db: Session = Depends(get_db)):
    return find_similar_docuemnts(db, document_id, limit=limit)


@router.get("/documents/{document_id}/duplicates")
def search_duplicated_document(document_id: int, similarity_threshold: float = 0.90, db:Session = Depends(get_db)):
    return detect_possible_duplicates(
        db, document_id, similarity_threshold=similarity_threshold
    )