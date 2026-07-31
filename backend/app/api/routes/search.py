from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.schemas.search import SearchResultResponse
from app.services.search_service import (
    detect_possible_duplicates as detect_duplicates_service,
    find_similar_documents as find_similar_documents_service,
    hybrid_search as hybrid_search_service,
    keyword_search as keyword_search_service,
    search_invoices as search_invoices_service,
    semantic_search as semantic_search_service,
)


router = APIRouter(prefix="/search", tags=["SEARCH"])


@router.get("/")
def search_status():
    return {
        "status": "ok",
        "message": "Search service is running.",
    }


@router.get(
    "/keyword",
    response_model=list[SearchResultResponse],
)
def keyword_search_route(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    return keyword_search_service(
        db=db,
        query=query,
        limit=limit,
    )


@router.get(
    "/semantic",
    response_model=list[SearchResultResponse],
)
def semantic_search_route(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    return semantic_search_service(
        db=db,
        query=query,
        limit=limit,
    )


@router.get(
    "/hybrid",
    response_model=list[SearchResultResponse],
)
def hybrid_search_route(
    query: str = Query(..., min_length=2),
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    return hybrid_search_service(
        db=db,
        query=query,
        limit=limit,
    )


@router.get("/invoices")
def search_invoices_route(
    supplier_name: str | None = None,
    invoice_number: str | None = None,
    currency: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    min_total_amount: float | None = Query(default=None, ge=0),
    max_total_amount: float | None = Query(default=None, ge=0),
    is_reviewed: bool | None = None,
    min_confidence: float | None = Query(
        default=None,
        ge=0,
        le=1,
    ),
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
):
    if (
        min_total_amount is not None
        and max_total_amount is not None
        and min_total_amount > max_total_amount
    ):
        raise HTTPException(
            status_code=400,
            detail="min_total_amount cannot be greater than max_total_amount.",
        )

    if date_from is not None and date_to is not None and date_from > date_to:
        raise HTTPException(
            status_code=400,
            detail="date_from cannot be later than date_to.",
        )

    return search_invoices_service(
        db=db,
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
def search_similar_documents_route(
    document_id: int,
    limit: int = Query(default=5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    try:
        return find_similar_documents_service(
            db=db,
            document_id=document_id,
            limit=limit,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error


@router.get("/documents/{document_id}/duplicates")
def search_duplicate_documents_route(
    document_id: int,
    similarity_threshold: float = Query(
        default=0.90,
        ge=0,
        le=1,
    ),
    db: Session = Depends(get_db),
):
    try:
        return detect_duplicates_service(
            db=db,
            document_id=document_id,
            similarity_threshold=similarity_threshold,
        )
    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error),
        ) from error