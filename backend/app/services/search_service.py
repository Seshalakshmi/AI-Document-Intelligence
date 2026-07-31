from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.services.embedding_service import create_embedding
from app.models.document_embedding import DocumentEmbedding
from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.extracted_invoice_data import ExtractedInvoiceData
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
                "chunk_index": chunk.chunk_index,
                "original_filename": document.original_filename,
                "content": chunk.content,
                "similarity": round(similarity, 4),
                "match_type": "semantic",
            }
        )

    return results


def hybrid_search(db: Session, 
                  query: str, 
                  limit: int = 5, 
                  semantic_weight: float = 0.6, 
                  keyword_weight: float = 0.4, 
                  fetch_multiplier: int = 3) -> list[dict]:
    semantic_results = semantic_search(db, query, 
                                       limit=limit * fetch_multiplier)
    keyword_results = keyword_search(db, query, limit=limit * fetch_multiplier)

    merged: dict[int, dict] = {}

    for result in semantic_results:
        chunk_id = result["chunk_id"]
        merged[chunk_id] = {
            **result,
            "score": result["similarity"] * semantic_weight,
            "match_type": "hybrid",
        }

    for result in keyword_results:
        chunk_id = result["chunk_id"]
        if chunk_id in merged:
            merged[chunk_id]["score"] += keyword_weight
        else:
            merged[chunk_id] = {
                **result,
                "score": keyword_weight,
                "match_type": "hybrid",
            }

    ranked = sorted(merged.values(), key=lambda result: result["score"], reverse=True)

    return ranked[:limit]


def search_invoices(
    db: Session,
    supplier_name: str | None = None,
    invoice_number: str | None = None,
    currency: str | None = None,
    date_from=None,
    date_to=None,
    min_total_amount=None,
    max_total_amount=None,
    is_reviewed: bool | None = None,
    min_confidence: float | None = None,
    uploaded_by_id: int | None = None,
    limit: int = 50,
    offset: int = 0,
) -> list[dict]:
    invoice_document = (
        db.query(ExtractedInvoiceData, Document)
        .join(Document, Document.id == ExtractedInvoiceData.document_id)
    )
 
    if supplier_name:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.supplier_name.ilike(f"%{supplier_name}%"))
    if invoice_number:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.invoice_number.ilike(f"%{invoice_number}%"))
    if currency:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.currency == currency)
    if date_from:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.invoice_date >= date_from)
    if date_to:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.invoice_date <= date_to)
    if min_total_amount is not None:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.total_amount >= min_total_amount)
    if max_total_amount is not None:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.total_amount <= max_total_amount)
    if is_reviewed is not None:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.is_reviewed == is_reviewed)
    if min_confidence is not None:
        invoice_document = invoice_document.filter(ExtractedInvoiceData.confidence_score >= min_confidence)
    if uploaded_by_id is not None:
        invoice_document = invoice_document.filter(Document.uploaded_by_id == uploaded_by_id)
 
    rows = (
        invoice_document.order_by(ExtractedInvoiceData.invoice_date.desc().nullslast())
        .offset(offset)
        .limit(limit)
        .all()
    )
 
    results = []
    for invoice, document in rows:
        results.append({
            "document_id": document.id,
            "original_filename": document.original_filename,
            "supplier_name": invoice.supplier_name,
            "invoice_number": invoice.invoice_number,
            "invoice_date": invoice.invoice_date,
            "currency": invoice.currency,
            "subtotal": invoice.subtotal,
            "tax_amount": invoice.tax_amount,
            "total_amount": invoice.total_amount,
            "payment_terms": invoice.payment_terms,
            "confidence_score": invoice.confidence_score,
            "is_reviewed": invoice.is_reviewed,
        })
 
    return results


def get_average_document_embedding(
    db: Session,
    document_id: int,
) -> list[float]:
    """
    Build one simple document-level vector by averaging its chunk vectors.
    """
    embeddings = (
        db.query(DocumentEmbedding)
        .filter(DocumentEmbedding.document_id == document_id)
        .all()
    )

    if not embeddings:
        raise ValueError(
            "Document has no embeddings. Vectorize the document first."
        )

    vectors = np.array(
        [embedding.embedding for embedding in embeddings],
        dtype=float,
    )

    average_vector = vectors.mean(axis=0)

    return average_vector.tolist()


def find_similar_documents(
    db: Session,
    document_id: int,
    limit: int = 5,
) -> list[dict]:
    """
    Find other documents whose chunks are close to the selected document.
    """
    source_document = db.get(Document, document_id)

    if source_document is None:
        raise ValueError("Document not found.")

    source_embedding = get_average_document_embedding(
        db=db,
        document_id=document_id,
    )

    distance = DocumentEmbedding.embedding.cosine_distance(
        source_embedding
    ).label("distance")

    rows = (
        db.query(Document, distance)
        .join(
            DocumentEmbedding,
            DocumentEmbedding.document_id == Document.id,
        )
        .filter(Document.id != document_id)
        .order_by(distance)
        .limit(limit * 5)
        .all()
    )

    best_result_by_document_id: dict[int, dict] = {}

    for document, distance_value in rows:
        similarity = 1 - float(distance_value)

        existing_result = best_result_by_document_id.get(document.id)

        if (
            existing_result is None
            or similarity > existing_result["similarity"]
        ):
            best_result_by_document_id[document.id] = {
                "document_id": document.id,
                "original_filename": document.original_filename,
                "similarity": round(similarity, 4),
            }

    results = list(best_result_by_document_id.values())

    results.sort(
        key=lambda result: result["similarity"],
        reverse=True,
    )

    return results[:limit]


def detect_possible_duplicates(
    db: Session,
    document_id: int,
    similarity_threshold: float = 0.90,
) -> list[dict]:
    """
    Check for possible duplicate documents using:

    1. File hash
    2. Extracted text hash
    3. Embedding similarity
    """
    source_document = db.get(Document, document_id)

    if source_document is None:
        raise ValueError("Document not found.")

    duplicates: dict[int, dict] = {}

    hash_filters = []

    if source_document.file_hash:
        hash_filters.append(
            Document.file_hash == source_document.file_hash
        )

    if source_document.text_hash:
        hash_filters.append(
            Document.text_hash == source_document.text_hash
        )

    if hash_filters:
        exact_matches = (
            db.query(Document)
            .filter(Document.id != document_id)
            .filter(or_(*hash_filters))
            .all()
        )

        for document in exact_matches:
            reasons = []

            if (
                source_document.file_hash
                and document.file_hash == source_document.file_hash
            ):
                reasons.append("file_hash")

            if (
                source_document.text_hash
                and document.text_hash == source_document.text_hash
            ):
                reasons.append("text_hash")

            duplicates[document.id] = {
                "document_id": document.id,
                "original_filename": document.original_filename,
                "similarity": None,
                "match_reason": "+".join(reasons),
            }

    # Semantic duplicate checking requires embeddings.
    # Hash duplicate results can still be returned without embeddings.
    try:
        similar_documents = find_similar_documents(
            db=db,
            document_id=document_id,
            limit=20,
        )
    except ValueError:
        similar_documents = []

    for document in similar_documents:
        if document["similarity"] < similarity_threshold:
            continue

        existing_result = duplicates.get(document["document_id"])

        if existing_result:
            existing_result["match_reason"] += "+embedding_similarity"
            existing_result["similarity"] = document["similarity"]
        else:
            duplicates[document["document_id"]] = {
                "document_id": document["document_id"],
                "original_filename": document["original_filename"],
                "similarity": document["similarity"],
                "match_reason": "embedding_similarity",
            }

    results = list(duplicates.values())

    # Exact hash matches have similarity=None.
    # Treat them as stronger than semantic-only matches.
    results.sort(
        key=lambda result: (
            result["similarity"] is None,
            result["similarity"] or 0,
        ),
        reverse=True,
    )

    return results