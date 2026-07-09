from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.document_chunk import DocumentChunk

router = APIRouter(prefix="/document_chunks", tags=["DOCUMENT_CHUNKS"])


@router.get("/")
def get_document(db: Session = Depends(get_db)):
    document_chunks = db.query(DocumentChunk).all()

    if not document_chunks:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return document_chunks


@router.post("/")
def upload_document(document_chunk: dict = Body(...), db: Session = Depends(get_db)):
    try:
        new_document_chunk = DocumentChunk(
            document_id=document_chunk["document_id"],
            supplier_name=document_chunk["supplier_name"],
            invoice_number=document_chunk["invoice_number"],
            invoice_date=document_chunk["invoice_date"],
            currency=document_chunk["currency"],
            subtotal=document_chunk["subtotal"],
            tax_amount=document_chunk["tax_amount"],
            total_amount=document_chunk["total_amount"],
            payment_terms=document_chunk["payment_terms"],
            confidence_score=document_chunk["confidence_score"],
            raw_extraction_json=document_chunk["raw_extraction_json"],
            is_reviewed=document_chunk["is_reviewed"]
        )

        db.add(new_document_chunk)
        db.commit()
        db.refresh(new_document_chunk)

        return {
            "message": "User successfully created",
            "user": new_document_chunk
        }
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_chunk_id}")
def get_user_by_id(document_chunk_id:int, db: Session = Depends(get_db)):
    document_chunk = db.query(DocumentChunk).filter(DocumentChunk.id == document_chunk_id).first()

    if not document_chunk:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return document_chunk