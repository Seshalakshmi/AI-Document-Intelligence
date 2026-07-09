# get all documents
# document by id
# upload_document (create)
from fastapi import APIRouter, Depends, Body, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.db.database import get_db
from app.models.document import Document

router = APIRouter(prefix="/documents", tags=["DOCUMENT"])


@router.get("/")
def get_document(db: Session = Depends(get_db)):
    documents = db.query(Document).all()

    if not documents:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return documents


@router.post("/")
def upload_document(document: dict = Body(...), db: Session = Depends(get_db)):
    try:
        existing_stored_filename = db.query(Document).filter(Document.stored_filename == document["stored_filename"]).first()
        
        if existing_stored_filename:
                raise HTTPException(status_code=400,detail="This file name is already exists.")
        
        
        new_document = Document(
            original_filename=document["original_filename"],
            stored_filename=document["stored_filename"],
            password_hash=document["password_hash"],
            file_path=document["file_path"],
            file_type=document["file_type"],
            file_size=document["file_size"],
            status=document["status"],
            raw_text=document["raw_text"],
            description=document["description"]
        )

        db.add(new_document)
        db.commit()
        db.refresh(new_document)

        return {
            "message": "User successfully created",
            "user": new_document
        }
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{document_id}")
def get_user_by_id(document_id:int, db: Session = Depends(get_db)):
    document = db.query(Document).filter(Document.id == document_id).first()

    if not document:
        raise HTTPException(status_code=404,detail="No users found.")
    
    return document