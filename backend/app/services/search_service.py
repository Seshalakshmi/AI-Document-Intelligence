from sqlalchemy.orm import Session
from app.services.embedding_service import create_embedding
from app.models.document_embedding import DocumentEmbedding
from app.models.document import Document
from app.models.document_chunk import DocumentChunk


def semantic_search(db: Session, query: str, limit: int=5) -> list[dict]:
    # this function helps document chunks by meaning
    query_embedding = create_embedding(query)
    distance = DocumentEmbedding.embedding.cosine_distance(query_embedding).label("distance")

    rows = (
        db.query(DocumentChunk, Document, distance)
        .join(DocumentEmbedding, DocumentEmbedding.chunk_id==DocumentChunk.id)
        .join(Document, Document.id==DocumentChunk.document_id)
        .order_by(distance)
        .limit(limit)
        .all()
    )

    results = []

    for chunk, document, distance_value in rows:
        similarity = 1 - float(distance_value)
        results.append(
            {
                "document_id": document.id,
                "chunk_id": chunk.id,
                "original_filename": document.original_filename,
                "content": chunk.content,
                "similarity": round(similarity, 4)
            }
        )

    return results


def get_average_docuemnt_embedding(db: Session, document_id: int) -> list[float]:
    pass


def find_similar_docuemnts(db: Session, document_id: int, limit: int=5) -> list[dict]:
    pass