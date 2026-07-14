# get all documents
# document by id
# upload_document (create)
from fastapi import APIRouter, Depends, Body, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse
from app.schemas.document_chunk import DocumentChunkResponse
from app.services.document_service import create_document_chunks, create_invoice_extraction
from app.models.extracted_invoice_data import ExtractedInvoiceData
from app.schemas.extracted_invoice_data import ExtractedInvoiceDataResponse
from app.services.text_extraction_service import extract_text
from app.services.chunking_service import chunk_text
from app.models.document_chunk import DocumentChunk
from pathlib import Path
import shutil
import hashlib
import uuid

router = APIRouter(prefix="/documents", tags=["DOCUMENT"])

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)
def calculate_file_hash(file_path: Path) -> str:
    sha256_hash = hashlib.sha256()

    with open(file_path, "rb") as file:
        for byte_block in iter(lambda: file.read(4096), b""):
            sha256_hash.update(byte_block)

    return sha256_hash.hexdigest()


@router.get("/", response_model=list[DocumentResponse])
def get_documents(db: Session = Depends(get_db)):
    documents = db.query(Document).all()

    if not documents:
        return []
    
    return documents


@router.post("/upload/{user_id}")
def upload_document(
    user_id: int,
    file: UploadFile = File(...),
    description: str | None = Form(None),
    db: Session = Depends(get_db)
):
    try:
        allowed_extensions = [".pdf", ".txt", ".docx"]
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
            status="text_extracted" if raw_text else "failed",
            raw_text=raw_text,
            description=description,
            uploaded_by_id=user_id
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        if raw_text:
            create_document_chunks(db, new_document, raw_text)
            create_invoice_extraction(db, new_document, raw_text)
            db.commit()
            db.refresh(new_document)

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


@router.get("/{document_id}")
def get_document_by_id(document_id:int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404,detail="Document not found.")
    
    return document


# @router.post("/")
# def upload_document(document: dict = Body(...), db: Session = Depends(get_db)):
#     try:
#         existing_stored_filename = db.query(Document).filter(Document.stored_filename == document["stored_filename"]).first()
        
#         if existing_stored_filename:
#                 raise HTTPException(status_code=400,detail="This file name is already exists.")
        
        
#         new_document = Document(
#             original_filename=document["original_filename"],
#             stored_filename=document["stored_filename"],
#             file_path=document["file_path"],
#             file_type=document["file_type"],
#             file_size=document["file_size"],
#             status=document["status"],
#             raw_text=document["raw_text"],
#             description=document["description"]
#         )

#         db.add(new_document)
#         db.commit()
#         db.refresh(new_document)

#         return {
#             "message": "User successfully created",
#             "user": new_document
#         }
#     except SQLAlchemyError as e:
#         db.rollback()
#         raise HTTPException(status_code=500, detail=str(e))
