from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.services.embedding_service import create_embeddings


def vectorize_document(db: Session, document_id: int) -> dict:
    """
    Convert all chunks belonging to one document into embeddings.

    Existing embeddings are deleted before new embeddings are saved.
    This allows a document to be vectorized again safely.
    """
    document = db.get(Document, document_id)

    if document is None:
        raise ValueError("Document not found.")

    chunks = (
        db.query(DocumentChunk)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(DocumentChunk.chunk_index)
        .all()
    )

    if not chunks:
        raise ValueError(
            "Document has no chunks. Upload or rebuild the document chunks first."
        )

    chunk_texts = [chunk.content for chunk in chunks]

    if any(not text.strip() for text in chunk_texts):
        raise ValueError("One or more document chunks are empty.")

    try:
        vectors = create_embeddings(chunk_texts)

        if len(vectors) != len(chunks):
            raise ValueError(
                "The number of generated embeddings does not match "
                "the number of document chunks."
            )

        # Remove old embeddings so vectorization can safely be repeated.
        deleted_embeddings = (
            db.query(DocumentEmbedding)
            .filter(DocumentEmbedding.document_id == document_id)
            .delete(synchronize_session=False)
        )

        for chunk, vector in zip(chunks, vectors):
            document_embedding = DocumentEmbedding(
                document_id=document_id,
                chunk_id=chunk.id,
                embedding=vector,
                embedding_model=settings.embedding_model_name,
                embedding_dimension=settings.embedding_dimension,
            )

            db.add(document_embedding)

        document.status = "vectorized"

        db.commit()

        return {
            "document_id": document_id,
            "chunks_vectorized": len(chunks),
            "embeddings_created": len(vectors),
            "old_embeddings_deleted": deleted_embeddings,
            "embedding_model": settings.embedding_model_name,
            "embedding_dimension": settings.embedding_dimension,
        }

    except Exception:
        db.rollback()
        raise