from langfuse.openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)


def generate_document_description(raw_text: str) -> str | None:
    """
    Generate a short, plain-English description of what a document is
    about -- meant for a tile/card preview, not a data dump. Deliberately
    narrative rather than a list of extracted fields (invoice number,
    totals, etc. already live in ExtractedInvoiceData and are shown
    separately in a table on the document detail page).

    e.g. "This is an invoice billed to Mr. Sharma for a travel package
    to Paris in 2026."
    """
    if not raw_text or not raw_text.strip():
        return None

    # Truncate -- we just need enough context for a one-sentence summary,
    # not the whole document, to keep this fast and cheap.
    excerpt = raw_text[:4000]

    completion = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "Write ONE short, plain-English sentence (max ~30 words) "
                    "describing what this document is and who/what it's about. "
                    "Sound natural, like a human summarizing it to a colleague -- "
                    "not a data extraction. Do NOT list specific field values like "
                    "invoice numbers, order numbers, or exact totals. Focus on the "
                    "subject: who it's for, what it's for, roughly what it covers. "
                    "Example style: 'This is an invoice billed to Mr. Sharma for a "
                    "travel package to Paris in 2026.'"
                ),
            },
            {"role": "user", "content": excerpt},
        ],
        name="generate-document-description",
        metadata={"raw_text_length": len(raw_text)},
    )

    return completion.choices[0].message.content.strip()
