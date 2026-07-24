from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.services.embedding_service import create_embedding
from app.models.document_embedding import DocumentEmbedding
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
import numpy as np


def keyword_search(db: Session, query: str, limit: int = 5, include_filename: bool = True) -> list[dict]:
    like_pattern = f"%{query}%"

    filters = [DocumentChunk.content.ilike(like_pattern)]

    query_document = (
        db.query(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
    )

    if include_filename:
        query_document = query_document.filter(
        or_(*filters, Document.original_filename.ilike(like_pattern))
        )
    else:
        query_document = query_document.filter(*filters)

    rows = (
        query_document.order_by(DocumentChunk.document_id, DocumentChunk.chunk_index)
        .limit(limit)
        .all()
    )

    results = []

    for chunk, document in rows:
        results.append({
            "document_id": document.id,
            "chunk_id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "original_filename": document.original_filename,
            "content": chunk.content,
            "match_type": "keyword",
        })

    return results

    

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
    '''
    create one average vector for a full docuemnt. I keep this function for simple mvp
    '''
    embeddings = (
        db.query(DocumentEmbedding)
        .filter(DocumentEmbedding.document_id == document_id)
        .all()
        )
    if not embeddings:
        raise ValueError("Document has no embeddings. Vectorize it first") 

    vectors = np.array([item.embedding for item in embeddings], dtype=float)

    average_vector = vectors.mean(axis=0)

    return average_vector.tolist()


def find_similar_docuemnts(db: Session, document_id: int, limit: int=5) -> list[dict]:
    query_embedding = get_average_docuemnt_embedding(db, document_id)
    distance = DocumentEmbedding.embedding.cosine_distance(query_embedding).label("distance")

    rows = (
        db.query(Document, distance)
        .join(DocumentEmbedding, DocumentEmbedding.document_id==Document.id)
        .filter(Document.id != document_id)
        .order_by(distance)
        .limit(limit * 5)
        .all()
    )

    best_result_by_docuemnt_id = {}

    for document, distance_value in rows:
        similarity = 1 - float(distance_value)
            
        existing = best_result_by_docuemnt_id.get(document.id)

        if existing is None or similarity > existing["similarity"]:
            best_result_by_docuemnt_id[document.id] = {
                "document_id" : document.id,
                "original_filename": document.original_filename,
                "similarity": round(similarity, 4)
            }

    return list(best_result_by_docuemnt_id.values())[:limit]


def define_possible_duplicates(db:Session, document_id: int, similarity_threshold: float=0.90)->list[dict]:
    source_document = db.query(Document).filter(Document.id == document_id).first()

    if source_document is None:
        return []

    duplicates: dict[int, dict] = {}

    hash_filters = []

    if source_document.file_hash:
        hash_filters.append(Document.file_hash == source_document.file_hash)

    if source_document.text_hash:
        hash_filters.append(Document.text_hash == source_document.text_hash)

    if hash_filters:
        exact_matches = (
            db.query(Document)
            .filter(Document.id != document_id)
            .filter(or_(*hash_filters))
            .all()
        )
        for document in exact_matches:
            duplicates[document.id] = {
                "document_id": document.id,
                "original_filename": document.original_filename,
                "similarity": 1.0,
                "match_reason": "exact_hash"
            }

    query_embedding = get_average_docuemnt_embedding(db, document_id)
    distance = DocumentEmbedding.embedding.cosine_distance(query_embedding).label("distance")

    rows = (
            db.query(Document, distance)
            .join(DocumentEmbedding, DocumentEmbedding.document_id==Document.id)
            .filter(Document.id != document_id)
            .order_by(distance)
            .all()
        )

    best_similarity_per_document: dict[int, float] = {}
    for document, distance_value in rows:
        similarity = 1 - float(distance_value)
        if similarity < similarity_threshold:
            continue
        if document.id not in best_similarity_per_document or similarity > best_similarity_per_document[document.id]:
            best_similarity_per_document[document.id] = similarity

    for document_id, similarity in best_similarity_per_document.items():
        if document_id in duplicates:
            continue

        document= db.query(Document).filter(Document.id == document_id).first()

        duplicates[document_id] = {
            "document_id": document_id,
            "original_filename": document.original_filename,
            "similarity": round(similarity, 4),
            "match_reason": "embedding_similarity",
        } 

    if not best_similarity_per_document:
        return "There is no duplicate documents available"
    
    return sorted(duplicates.values(), key=lambda d: d["similarity"], reverse=True)
    