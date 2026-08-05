from fastapi import APIRouter, Depends, Body, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db

from app.models.document import Document
from app.models.user import Users
from app.models.extracted_invoice_data import ExtractedInvoiceData
from app.models.document_chunk import DocumentChunk

from app.schemas.document import DocumentResponse
from app.schemas.document_chunk import DocumentChunkResponse
from app.schemas.extracted_invoice_data import ExtractedInvoiceDataResponse

from app.services.document_service import create_document_chunks, create_invoice_extraction
from app.services.chunking_service import create_chunks_for_document
from app.services.text_extraction_service import extract_text
from app.services.vectorization_service import vectorize_document

from datetime import datetime, timezone
from pathlib import Path
import shutil
import hashlib
import uuid
import os

router = APIRouter(prefix="/documents", tags=["DOCUMENT"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def calculate_file_hash(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as file:
        for byte_block in iter(lambda: file.read(4096), b""):
            sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()


def calculate_text_hash(raw_text: str) -> str:
    """
    Creates a stable hash from extracted text.

    Extra spaces and letter casing are ignored so that text with small
    formatting differences can still receive the same hash.
    """
    normalized_text = " ".join(raw_text.casefold().split())

    return hashlib.sha256(
        normalized_text.encode("utf-8")
    ).hexdigest()


@router.get("/", response_model=list[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()

    if not documents:
        return []
    
    return documents

@router.get("/{document_id}")
def get_document_by_id(document_id:int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404,detail="Document not found.")
    
    return document


@router.post("/upload/{user_id}")
def upload_document(
    user_id: int,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    db: Session = Depends(get_db)
):
    try:
        allowed_extensions = [".pdf", ".txt", ".docx", ".png", ".jpg", ".jpeg"]
        if not file.filename:
            raise HTTPException(status_code=400, detail="Filename is required.")

        original_filename = file.filename
        file_extension = Path(original_filename).suffix.lower()

        if file_extension not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail="Only PDF, TXT, and DOCX files are allowed."
            )

        stored_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = UPLOAD_DIR / stored_filename

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)

        file_size = file_path.stat().st_size

        max_file_size = 10 * 1024 * 1024  # 10 MB

        if file_size > max_file_size:
            file_path.unlink()
            raise HTTPException(status_code=400, detail="File is too large.")

        file_hash = calculate_file_hash(file_path)

        raw_text = extract_text(file_path, file_extension)

        text_hash = calculate_text_hash(raw_text) if raw_text else None
        
        existing_document = db.query(Document).filter(
            Document.file_hash == file_hash
        ).first()

        if existing_document:
            file_path.unlink()

            raise HTTPException(
                status_code=400,
                detail="Duplicate document already exists."
            )

        new_document = Document(
            original_filename=original_filename,
            stored_filename=stored_filename,
            file_path=str(file_path),
            file_type=file_extension,
            file_size=file_size,
            file_hash=file_hash,
            text_hash=text_hash,
            status="text_extracted" if raw_text else "failed",
            raw_text=raw_text,
            description=description,
            uploaded_by_id=user_id,
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        if raw_text:
            create_document_chunks(db, new_document, raw_text)

            # Invoice extraction needs an LLM -- optional until OPENAI_API_KEY is set.
            if os.getenv("OPENAI_API_KEY"):
                create_invoice_extraction(db, new_document, raw_text)

            db.commit()
            db.refresh(new_document)

            # Vectorization only needs the local sentence-transformers model,
            # not OpenAI -- so it can always run right after upload, no
            # separate "Vectorize" step or button needed.
            try:
                vectorize_document(db, new_document.id)
                db.refresh(new_document)
            except ValueError as e:
                # Don't fail the whole upload if vectorization has a problem
                # (e.g. empty chunks) -- the document still exists as
                # "chunked" and can be vectorized later via
                # POST /documents/{id}/vectorize if needed.
                print(f"Vectorization failed for document {new_document.id}: {e}")

            return {
                "message": "Document uploaded successfully",
                "document": new_document
            }
        
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}/chunks", response_model=list[DocumentChunkResponse])
def get_document_chunks(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).order_by(DocumentChunk.chunk_index).all()

    return chunks


@router.get("/{document_id}/invoice-data", response_model=ExtractedInvoiceDataResponse)
def get_document_invoice_data(document_id: int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found.")

    invoice_data = db.query(ExtractedInvoiceData).filter(
        ExtractedInvoiceData.document_id == document_id
    ).first()

    if not invoice_data:
        raise HTTPException(status_code=404, detail="Invoice data not found.")

    return invoice_data


@router.post("/{document_id}/chunks/rebuild", response_model=list[DocumentChunkResponse])
def rebuild_document_chunks(document_id: int, db: Session = Depends(get_db)):
    try:
        chunks = create_chunks_for_document(db, document_id)
        return chunks

    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/{document_id}/vectorize")
def vectorize_document_endpoint(document_id: int, db: Session = Depends(get_db)):
    try:
        return vectorize_document(db, document_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.put("/{document_id}/invoice-data/review/{user_id}",  response_model=ExtractedInvoiceDataResponse)
def review_invoice_data(
    user_id: int,
    document_id: int,
    update_data: dict = Body(...),
    db: Session = Depends(get_db)
):
    invoice_data = db.query(ExtractedInvoiceData).filter(
        ExtractedInvoiceData.document_id == document_id
    ).first()

    if not invoice_data:
        raise HTTPException(status_code=404, detail="Invoice data not found.")

    invoice_data.supplier_name = update_data.get("supplier_name", invoice_data.supplier_name)
    invoice_data.invoice_number = update_data.get("invoice_number", invoice_data.invoice_number)
    invoice_data.currency = update_data.get("currency", invoice_data.currency)
    invoice_data.payment_terms = update_data.get("payment_terms", invoice_data.payment_terms)
    invoice_data.invoice_date = update_data.get("invoice_date", invoice_data.invoice_date)
    invoice_data.subtotal = update_data.get("subtotal", invoice_data.subtotal)
    invoice_data.tax_amount = update_data.get("tax_amount", invoice_data.tax_amount)
    invoice_data.total_amount = update_data.get("total_amount", invoice_data.total_amount)
    
    invoice_data.is_reviewed = True

    reviewer = db.query(Users).filter(Users.id == user_id).first()

    if not reviewer:
        raise HTTPException(status_code=404, detail="Reviewer user not found.")

    invoice_data.reviewed_by_id = user_id
    invoice_data.reviewed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(invoice_data)

    return invoice_data
