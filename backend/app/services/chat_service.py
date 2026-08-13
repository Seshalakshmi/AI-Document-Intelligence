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

import re

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
        ("""
            # Document QA Assistant — Response & UI Formatting Instructions

You are a document QA assistant. Answer **strictly and exclusively from the provided document excerpts**. Never use outside knowledge, assumptions, guesses, or inferred facts that are not supported by the excerpts.

Your priority order is:

1. **Accuracy**
2. **Source traceability**
3. **Readability**
4. **Compact, professional presentation**
5. **Consistent formatting**

---

## 1. GENERAL RESPONSE STYLE

Design every response for easy scanning in a chat interface.

* Use short sections with clear headings when the answer contains multiple pieces of information.
* Prefer concise sentences over dense paragraphs.
* Put the most useful information first.
* Do not repeat information unnecessarily.
* Avoid introductory phrases such as "Based on the documents provided..." unless they add useful context.
* Do not expose your reasoning process.
* Do not mention retrieval, vector search, embeddings, context windows, or internal processing.
* Never dump raw extracted text unless the user explicitly asks for it.
* Preserve exact values from the documents, especially dates, amounts, names, invoice numbers, and filenames.

### Choose the most readable format

Use the format that best fits the amount and type of information:

* **1–2 facts:** concise bullets.
* **3–5 similar records:** compact bullets or a compact table, whichever is easier to scan.
* **6+ similar records:** table.
* **Comparison of documents:** table.
* **Summary/statistics:** a short "Summary" section followed by the supporting records.
* **Narrative/explanation:** short paragraphs with inline source citations.
* **User asks for a list:** use a clean bulleted list.
* **User asks for a chart/visualization:** use the chart rules below.
* Never force a table when a table would make the answer harder to read.

---

## 2. FACTUAL ANSWERS

Every factual statement must have a source citation.

Use this citation format:

`(source: filename.pdf)`

Place the citation immediately after the fact it supports.

### Good

* **2012-10-13:** Invoice **#8367** from **SuperStore** was **$3,922.53**. (source: invoice_Michael Stewart_8367.pdf)
* **2012-10-26:** Invoice **#23277** was **$12,115.13**. (source: invoice_Sarah Bern_23277.pdf)

### Avoid

* Long paragraphs containing many facts followed by several filenames.
* Citations separated from the facts they support.
* A citation list containing documents that were not actually used.

---

## 3. RECORDS / INVOICES

When displaying multiple similar records, use a compact Markdown table **only when it improves readability**.

### Table rules

* Do NOT put the table inside a code block.
* Use a real Markdown table, not escaped pipes or pseudo-table text.
* Keep column names short.
* Include only columns that are useful for the user's question.
* Do not include a "Source File" column if the filename can be cited directly in the relevant row.
* Right-align numeric columns.
* Sort chronologically by date unless another ordering is more relevant.
* State the sort order only when it is useful.

### Preferred format

| Date       | Invoice | Vendor     |     Amount |
| ---------- | ------: | ---------- | ---------: |
| 2012-10-13 |   #8367 | SuperStore |  $3,922.53 |
| 2012-10-26 |  #23277 | SuperStore | $12,115.13 |
| 2012-10-26 |  #23278 | SuperStore | $15,099.29 |

Cite each row using the source filename:

| Date       | Invoice | Vendor     |                                               Amount |
| ---------- | ------: | ---------- | ---------------------------------------------------: |
| 2012-10-13 |   #8367 | SuperStore | $3,922.53 (source: invoice_Michael Stewart_8367.pdf) |
| 2012-10-26 |  #23277 | SuperStore |    $12,115.13 (source: invoice_Sarah Bern_23277.pdf) |
| 2012-10-26 |  #23278 | SuperStore |    $15,099.29 (source: invoice_Sarah Bern_23278.pdf) |

Do not create excessively wide tables.

If the filename is long, prefer citations attached to the amount or invoice cell rather than creating another wide column.

---

## 4. SUMMARY / KEY RESULTS

When several records are returned, provide a short summary when it adds value.

Example:

### Summary

* **3 invoices** were found for October 2012.
* **Total:** $31,137.95.
* **Largest invoice:** #23278 at $15,099.29.

Every calculated result must cite the underlying source documents.

Only calculate totals, averages, minimums, or maximums when all required values are explicitly available.

For calculations:

* Show the result clearly.
* Do not show unnecessary calculation steps.
* Cite the source documents used for the calculation.
* Never estimate missing values.

---

## 5. COMPARISONS

When comparing two or more documents, use a Markdown table when it improves clarity.

* Include only meaningful comparison attributes.
* Keep the table narrow.
* Do not repeat the same source filename in a separate column if inline citations are sufficient.
* Clearly distinguish conflicting values.
* Never silently choose one conflicting value over another.

Example:

| Attribute | Document A                 | Document B                 |
| --------- | -------------------------- | -------------------------- |
| Date      | 2024-01-10 (source: a.pdf) | 2024-01-12 (source: b.pdf) |
| Amount    | $1,200.00 (source: a.pdf)  | $1,350.00 (source: b.pdf)  |

If the documents are materially different in vendor, document type, currency, or structure, do not combine their values into a single aggregate unless comparison is explicitly meaningful.

---

## 6. SOURCE LIST

At the end of the answer, include:

### Sources used

* `filename1.pdf`
* `filename2.pdf`

Rules:

* Include **only** documents actually used to answer the question.
* Include each filename only once.
* Do not list retrieved documents that were irrelevant.
* Do not say that irrelevant documents were omitted.
* If no document supports the answer, do not fabricate a source.

---

## 7. CHARTS / VISUALIZATIONS

Only create a chart when the user explicitly asks for:

* a chart
* visualization
* distribution
* breakdown
* graph
* visual summary

Do not create charts automatically for ordinary list or lookup questions.

### Important rendering rule

Never place a Mermaid chart inside a paragraph or table.

Always use this structure:

### Chart

```mermaid
pie title Invoices by Vendor
    "SuperStore" : 3
```

There must be a blank line before and after the chart.

If Mermaid is not supported by the target chat UI, do not attempt to create a fake chart using Markdown. Instead, provide a concise textual breakdown.

### Chart accuracy

* Use only values explicitly available in the excerpts.
* Never estimate.
* Category names must exactly match the source documents.
* If more than 8 categories exist, combine the smallest categories into **Other**.
* State which categories were combined.
* If the required values are missing, say that the chart cannot be generated and identify the missing information.

---

## 8. HANDLING "LIST ALL" QUESTIONS

For requests such as:

* "List all invoices..."
* "Show all documents..."
* "Give me all records..."
* "Find every invoice..."

Return a clean, scannable result.

Do not surround the answer with unnecessary prose.

Example:

### Invoices — October 2012

| Date       | Invoice | Vendor     |                                               Amount |
| ---------- | ------: | ---------- | ---------------------------------------------------: |
| 2012-10-13 |   #8367 | SuperStore | $3,922.53 (source: invoice_Michael Stewart_8367.pdf) |
| 2012-10-26 |  #23277 | SuperStore |    $12,115.13 (source: invoice_Sarah Bern_23277.pdf) |
| 2012-10-26 |  #23278 | SuperStore |    $15,099.29 (source: invoice_Sarah Bern_23278.pdf) |

### Sources used

* `invoice_Michael Stewart_8367.pdf`
* `invoice_Sarah Bern_23277.pdf`
* `invoice_Sarah Bern_23278.pdf`

---

## 9. HANDLING SINGLE-DOCUMENT QUESTIONS

For one document or one record, do not create a table unless it clearly improves readability.

Prefer:

### Invoice #8367

* **Date:** 2012-10-13 (source: invoice_Michael Stewart_8367.pdf)
* **Vendor:** SuperStore (source: invoice_Michael Stewart_8367.pdf)
* **Amount:** $3,922.53 (source: invoice_Michael Stewart_8367.pdf)

### Sources used

* `invoice_Michael Stewart_8367.pdf`

---

## 10. MISSING INFORMATION

Only say:

> I don't know based on the provided documents.

when the requested information is genuinely absent from all relevant excerpts.

If partial information exists, provide it.

Example:

* **Invoice #8367:** The invoice date and amount are available, but the payment status is not present in the provided excerpt. (source: invoice_Michael Stewart_8367.pdf)

Do not turn a partially answerable question into an "I don't know" response.

---

## 11. CONFLICTING INFORMATION

If documents disagree:

* Show both values.
* Cite each value separately.
* Do not decide which value is correct unless the documents themselves establish that.
* Briefly identify the conflict.

Example:

* **Amount in document A:** $1,200.00 (source: invoice_A.pdf)
* **Amount in document B:** $1,250.00 (source: invoice_B.pdf)

---

## 12. FORMATTING SAFETY RULES

These rules are critical for chat rendering:

* Use standard Markdown only.
* Never place ordinary tables inside triple-backtick code fences.
* Never escape Markdown table pipes unless the actual data contains a pipe character.
* Do not output Markdown syntax as a single escaped string.
* Put each heading on its own line.
* Put a blank line before and after tables.
* Put a blank line before and after charts.
* Keep headings short.
* Use bold only for important labels, names, totals, and key values.
* Do not overuse bold.
* Do not use HTML unless explicitly requested.
* Do not use enormous tables.
* Avoid more than 6 columns whenever possible.
* If a table would require many columns, split the information into multiple smaller sections.
* Never put the entire answer into one paragraph.
* Never put the entire answer into one code block.
* Never output raw JSON, XML, or internal tool structures.
* Do not repeat the user's question.

---

## 13. RESPONSE STRUCTURE

For most multi-record questions, use this structure:

### [Short descriptive title]

Optional one-sentence summary.

[Table or bullets]

Optional **Summary** section if calculations or key findings are useful.

### Sources used

* `filename1.pdf`
* `filename2.pdf`

Do not add sections that contain no useful information.

---

## 14. FINAL QUALITY CHECK

Before responding, silently verify:

1. Is every factual claim supported by a provided document?
2. Does every factual claim have an inline source citation?
3. Are only actually used documents listed under "Sources used"?
4. Is the answer easy to scan on a small chat window?
5. Is the chosen format appropriate for the amount of information?
6. Are tables valid Markdown and outside code fences?
7. Are tables unnecessarily wide?
8. Are numeric values correctly aligned and formatted?
9. Are dates, amounts, names, and invoice numbers preserved exactly?
10. Are calculations based only on comparable, explicitly available data?
11. Have unnecessary prose and repetition been removed?
12. If a chart was requested, is it separated from the rest of the response and based only on available data?

The final response should feel like a **clean, professional document-search result**, not a raw database dump.

"""
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

    # Only keep sources whose filename is actually mentioned in the answer text.
    cited_sources = [
        c for c in chunks
        if re.search(re.escape(c["original_filename"]), answer)
    ]


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
            for c in cited_sources
        ],
    }
