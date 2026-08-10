import os

from sqlalchemy.orm import Session

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

from app.core.config import settings
from langfuse import Langfuse
from langfuse.langchain import CallbackHandler

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.services.embedding_service import create_embedding


Langfuse(
    public_key=settings.langfuse_public_key,
    secret_key=settings.langfuse_secret_key,
    host=settings.langfuse_host,
)

langfuse_handler = CallbackHandler()


def get_llm() -> ChatOpenAI:
    # Same env var your invoice_extraction_service already reads --
    # no new config wiring needed.
    return ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))


# ---------------------------------------------------------------------------
# Per-document chat (unchanged) -- scoped to one document's chunks.
# ---------------------------------------------------------------------------

def get_relevant_chunks_for_document(
    db: Session, document_id: int, question: str, limit: int = 5
) -> list[dict]:
    """
    Semantic search scoped to ONE document's chunks, reusing the same
    pgvector cosine-distance approach as search_service.semantic_search,
    just filtered to a single document_id instead of the whole corpus.
    """
    query_embedding = create_embedding(question)
    distance = DocumentEmbedding.embedding.cosine_distance(query_embedding).label("distance")

    rows = (
        db.query(DocumentChunk, distance)
        .join(DocumentEmbedding, DocumentEmbedding.chunk_id == DocumentChunk.id)
        .filter(DocumentChunk.document_id == document_id)
        .order_by(distance)
        .limit(limit)
        .all()
    )

    return [
        {
            "chunk_id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "similarity": round(1 - float(dist), 4),
        }
        for chunk, dist in rows
    ]


DOCUMENT_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant answering questions about ONE specific "
            "document. Use only the provided context excerpts to answer. If the "
            "context doesn't contain the answer, say you don't know rather than "
            "guessing or using outside knowledge. Be concise.",
        ),
        (
            "human",
            "Context excerpts from the document:\n\n{context}\n\nQuestion: {question}",
        ),
    ]
)


def answer_document_question(db: Session, document_id: int, question: str) -> dict:
    document = db.get(Document, document_id)
    if document is None:
        raise ValueError("Document not found.")

    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY is not configured on the server.")

    chunks = get_relevant_chunks_for_document(db, document_id, question)

    if not chunks:
        return {
            "answer": (
                "I don't have any vectorized content for this document yet. "
                "Run POST /documents/{id}/vectorize first, then try again."
            ),
            "sources": [],
        }

    context = "\n\n---\n\n".join(f"[chunk {c['chunk_index']}] {c['content']}" for c in chunks)

    chain = DOCUMENT_PROMPT | get_llm() | StrOutputParser()
    answer = chain.invoke(
        {"context": context, "question": question},
        config={"callbacks": [langfuse_handler]},
    )

    return {
        "answer": answer,
        "sources": [
            {"chunk_id": c["chunk_id"], "chunk_index": c["chunk_index"], "similarity": c["similarity"]}
            for c in chunks
        ],
    }


# ---------------------------------------------------------------------------
# Global chat -- searches across every document's chunks, not just one.
# This is what handles questions like "what did Sarah Bern purchase for
# Paris in 2026" without picking a document first -- it's the same
# retrieval approach as search_service.semantic_search, reused here so
# chat can cite which document each answer came from.
# ---------------------------------------------------------------------------

def get_relevant_chunks_global(db: Session, question: str, limit: int = 8) -> list[dict]:
    query_embedding = create_embedding(question)
    distance = DocumentEmbedding.embedding.cosine_distance(query_embedding).label("distance")

    rows = (
        db.query(DocumentChunk, Document, distance)
        .join(DocumentEmbedding, DocumentEmbedding.chunk_id == DocumentChunk.id)
        .join(Document, Document.id == DocumentChunk.document_id)
        .order_by(distance)
        .limit(limit)
        .all()
    )

    return [
        {
            "document_id": document.id,
            "original_filename": document.original_filename,
            "chunk_id": chunk.id,
            "chunk_index": chunk.chunk_index,
            "content": chunk.content,
            "similarity": round(1 - float(dist), 4),
        }
        for chunk, document, dist in rows
    ]


GLOBAL_PROMPT = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "You are a helpful assistant that answers questions using excerpts "
            "Answer using only the provided document excerpts. "
            "Be concise and specific. Prefer dates, amounts, names, invoice numbers, and document filenames when available. Make those information in each line with bulletin points"
            "If multiple documents are relevant, compare them clearly using tables. "
            "Always mention the source filename for factual claims. "
            "If the answer is not in the excerpts, say you don't know.",
        ),
        (
            "human",
            "Context excerpts from across the document library:\n\n{context}\n\nQuestion: {question}",
        ),
    ]
)


def answer_global_question(db: Session, question: str) -> dict:
    if not os.getenv("OPENAI_API_KEY"):
        raise ValueError("OPENAI_API_KEY is not configured on the server.")

    chunks = get_relevant_chunks_global(db, question)

    if not chunks:
        return {
            "answer": (
                "I don't have any vectorized documents to search yet. Upload "
                "and vectorize at least one document, then try again."
            ),
            "sources": [],
        }

    context = "\n\n---\n\n".join(
        f"[Document: {c['original_filename']}, chunk {c['chunk_index']}] {c['content']}"
        for c in chunks
    )

    chain = GLOBAL_PROMPT | get_llm() | StrOutputParser()
    answer = chain.invoke(
        {"context": context, "question": question},
        config={"callbacks": [langfuse_handler]},
    )

    return {
        "answer": answer,
        "sources": [
            {
                "document_id": c["document_id"],
                "original_filename": c["original_filename"],
                "chunk_id": c["chunk_id"],
                "chunk_index": c["chunk_index"],
                "similarity": c["similarity"],
            }
            for c in chunks
        ],
    }
