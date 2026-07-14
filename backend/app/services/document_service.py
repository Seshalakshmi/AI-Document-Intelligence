from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.chunking_service import chunk_text
from app.models.extracted_invoice_data import ExtractedInvoiceData
from app.services.invoice_extraction_service import extract_invoice_data
from fastapi import UploadFile
from pathlib import Path
import uuid
import shutil
from sqlalchemy.orm import Session

def save_uploaded_file(file: UploadFile, upload_dir: Path) -> tuple[Path, str]:
    file_extension = Path(file.filename).suffix.lower()
    stored_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / stored_filename

    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    return file_path, stored_filename


def create_invoice_extraction(db: Session, document: Document, raw_text: str) -> None:
    data = extract_invoice_data(raw_text)

    invoice_data = ExtractedInvoiceData(
        document_id=document.id,
        supplier_name=data["supplier_name"],
        invoice_number=data["invoice_number"],
        invoice_date=data["invoice_date"],
        currency=data["currency"],
        subtotal=data["subtotal"],
        tax_amount=data["tax_amount"],
        total_amount=data["total_amount"],
        payment_terms=data["payment_terms"],
        confidence_score=data["confidence_score"],
        raw_extraction_json=data["raw_extraction_json"],
    )

    db.add(invoice_data)
    

def create_document_chunks(
    db: Session,
    document: Document,
    raw_text: str
) -> None:
    chunks = chunk_text(raw_text)

    for chunk in chunks:
        new_chunk = DocumentChunk(
            document_id=document.id,
            chunk_index=chunk["chunk_index"],
            content=chunk["content"],
            start_char=chunk["start_char"],
            end_char=chunk["end_char"],
            token_count=chunk["token_count"]
        )

        db.add(new_chunk)

    document.status = "chunked"
