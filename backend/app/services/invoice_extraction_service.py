from datetime import date
from decimal import Decimal

from langfuse.openai import OpenAI
from pydantic import BaseModel, Field
import os

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


class InvoiceData(BaseModel):
    supplier_name: str | None = Field(
        default=None, description="Name of the company/vendor issuing the invoice"
    )
    invoice_number: str | None = Field(
        default=None, description="The invoice number or ID"
    )
    invoice_date: str | None = Field(
        default=None, description="Invoice date in YYYY-MM-DD format"
    )
    currency: str | None = Field(
        default=None, description="3-letter currency code, e.g. USD, EUR, INR"
    )
    subtotal: float | None = Field(
        default=None, description="Subtotal amount before tax"
    )
    tax_amount: float | None = Field(
        default=None, description="Tax amount charged"
    )
    total_amount: float | None = Field(
        default=None, description="Final total amount due"
    )
    payment_terms: str | None = Field(
        default=None, description="Payment terms, e.g. 'Net 30'"
    )
    confidence_score: float = Field(
        default=0.0, description="Model's confidence in the extraction, 0-1"
    )


def extract_invoice_data(raw_text: str) -> dict:
    """
    Extract structured invoice fields from raw invoice text using an LLM
    with structured outputs, instead of hand-written regex parsing.
    """
    response = client.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert invoice-parsing assistant. Extract the "
                    "requested fields exactly as they appear on the invoice. "
                    "If a field is not present or you are unsure, leave it null "
                    "rather than guessing. Set confidence_score to reflect how "
                    "certain you are about the extraction overall (0.0 to 1.0)."
                ),
            },
            {"role": "user", "content": raw_text},
        ],
        response_format=InvoiceData,
        # Langfuse-specific trace attributes -- shows up nicely in the dashboard
        name="extract-invoice-data",
        metadata={"raw_text_length": len(raw_text)},
    )

    parsed: InvoiceData = response.output_parsed

    # Convert back to the richer Python types the rest of the app expects
    parsed_date: date | None = None
    if parsed.invoice_date:
        try:
            parsed_date = date.fromisoformat(parsed.invoice_date)
        except ValueError:
            parsed_date = None

    def to_decimal(value: float | None) -> Decimal | None:
        return Decimal(str(value)) if value is not None else None

    return {
        "supplier_name": parsed.supplier_name,
        "invoice_number": parsed.invoice_number,
        "invoice_date": parsed_date,
        "currency": parsed.currency,
        "subtotal": to_decimal(parsed.subtotal),
        "tax_amount": to_decimal(parsed.tax_amount),
        "total_amount": to_decimal(parsed.total_amount),
        "payment_terms": parsed.payment_terms,
        "confidence_score": parsed.confidence_score,
        "raw_extraction_json": parsed.model_dump_json()
    }