import os

from sqlalchemy.orm import Session

from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_openai import ChatOpenAI

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.models.document_embedding import DocumentEmbedding
from app.services.embedding_service import create_embedding


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


PROMPT = ChatPromptTemplate.from_messages(
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


def get_llm() -> ChatOpenAI:
    # Same env var your invoice_extraction_service already reads --
    # no new config wiring needed.
    return ChatOpenAI(model="gpt-4o-mini", temperature=0, api_key=os.getenv("OPENAI_API_KEY"))


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

    chain = PROMPT | get_llm() | StrOutputParser()
    answer = chain.invoke({"context": context, "question": question})

    return {
        "answer": answer,
        "sources": [
            {"chunk_id": c["chunk_id"], "chunk_index": c["chunk_index"], "similarity": c["similarity"]}
            for c in chunks
        ],
    }
