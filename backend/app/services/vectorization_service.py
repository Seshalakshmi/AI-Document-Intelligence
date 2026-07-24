from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.services.embedding_service import create_embeddings

 
def vectorize_document(db: Session, document_id: int) -> dict:
    ''' 
    convert all chunks of one document to embeddings 
    
    '''
    document = db.get(Document, document_id)
    if document is None:
        raise ValueError("Document not found")

    chunks = db.query(DocumentChunk).filter(
        DocumentChunk.document_id == document_id
    ).order_by(DocumentChunk.chunk_index).all()
   
    if not chunks:
        raise ValueError("Document has no chunks yet")

    chunk_texts = [chunk.content for chunk in chunks]
    embeddings = create_embeddings(chunk_texts)

    for chunk, embedding in zip(chunks, embeddings):
        document_embedding = DocumentEmbedding(
            document_id=document_id,
            chunk_id=chunk.id,
            embedding=embedding,
            embedding_model=settings.embedding_model_name,
            embedding_dimension=settings.embedding_dimension,
        )

        db.add(document_embedding)
    
    document.status = "vectorized"
    db.commit()

    return {
        "document_id": document_id,
        "chunks_vectorize": len(chunks),
        "embeddings_created": len(embeddings),
        "embedding_model": settings.embedding_model_name,
        "embedding_dimension": settings.embedding_dimension
    }

