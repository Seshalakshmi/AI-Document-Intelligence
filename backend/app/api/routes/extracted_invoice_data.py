from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.extracted_invoice_data import ExtractedInvoiceData

router = APIRouter(prefix="/extracted_invoice_data", tags=["EXTRACTED_INVOICE_DATA"])


@router.get("/")
def get_document(db: Session = Depends(get_db)):
    invoice_data = db.query(ExtractedInvoiceData).all()

    if not invoice_data:
        raise HTTPException(status_code=404,detail="No invoice data found.")
    
    return invoice_data


@router.post("/")
def upload_document(invoice_data: dict = Body(...), db: Session = Depends(get_db)):
    try:
        new_invoice_data = ExtractedInvoiceData(
            document_id=invoice_data["document_id"],
            supplier_name=invoice_data["supplier_name"],
            invoice_number=invoice_data["invoice_number"],
            invoice_date=invoice_data["invoice_date"],
            currency=invoice_data["currency"],
            subtotal=invoice_data["subtotal"],
            tax_amount=invoice_data["tax_amount"],
            total_amount=invoice_data["total_amount"],
            payment_terms=invoice_data["payment_terms"],
            confidence_score=invoice_data["confidence_score"],
            raw_extraction_json=invoice_data["raw_extraction_json"],
            is_reviewed=invoice_data["is_reviewed"]
        )

        db.add(new_invoice_data)
        db.commit()
        db.refresh(new_invoice_data)

        return {
            "message": "Invoice data successfully created",
            "user": new_invoice_data
        }
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
def get_user_by_id(document_id:int, db: Session = Depends(get_db)):
    invoice_data = db.query(ExtractedInvoiceData).filter(ExtractedInvoiceData.document_id == document_id).first()

    if not invoice_data:
        raise HTTPException(status_code=404,detail="No invoices found.")
    
    return invoice_data