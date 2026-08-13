from datetime import date
from decimal import Decimal


from pydantic import BaseModel, Field
from langfuse.openai import OpenAI
from app.core.config import settings

client = OpenAI(api_key=settings.openai_api_key)


class InvoiceAddress(BaseModel):
    name: str | None = Field(
        default=None, description="Name of the person or company at this address"
    )
    city: str | None = Field(default=None)
    state: str | None = Field(default=None)
    country: str | None = Field(default=None)


class InvoiceLineItem(BaseModel):
    name: str | None = Field(default=None, description="Product or service description")
    quantity: float | None = Field(default=None)
    rate: float | None = Field(default=None, description="Unit price")
    amount: float | None = Field(default=None, description="Line total (quantity x rate)")


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
    bill_to: InvoiceAddress | None = Field(
        default=None, description="Billing address / recipient of the invoice"
    )
    ship_to: InvoiceAddress | None = Field(
        default=None, description="Shipping address, if different from billing"
    )
    ship_mode: str | None = Field(
        default=None, description="Shipping method, e.g. 'Standard Class'"
    )
    order_id: str | None = Field(
        default=None, description="Purchase order or sales order ID, if present"
    )
    items: list[InvoiceLineItem] = Field(
        default_factory=list,
        description=(
            "Every real line item on the invoice, from the 'Item Quantity "
            "Rate Amount' table. Do not create an item from a trailing "
            "metadata line (category, sub-category, product/SKU code) that "
            "follows an item's amount -- that describes the item above it, "
            "not a new one."
        ),
    )
    subtotal: float | None = Field(
        default=None, description="Subtotal amount before tax"
    )
    discount: float | None = Field(
        default=None, description="Discount amount, if any"
    )
    shipping: float | None = Field(
        default=None, description="Shipping/freight charge, if any"
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
    notes: str | None = Field(
        default=None, description="Any additional notes or remarks on the invoice"
    )
    confidence_score: float = Field(
        default=0.0, description="Model's confidence in the extraction, 0-1"
    )


def extract_invoice_data(raw_text: str) -> dict:
    """
    Extract structured invoice fields from raw invoice text using an LLM
    with structured outputs, instead of hand-written regex parsing.
    """
    completion = client.chat.completions.parse(
        model="gpt-4o-mini",
        messages=[
            {
                "role": "system",
                "content": (
                    "You are an expert invoice-parsing assistant. Extract the "
                    "requested fields exactly as they appear on the invoice. "
                    "The bill-to and ship-to addresses and the line items are "
                    "almost always present on a real invoice even when the "
                    "layout is messy (e.g. from PDF text extraction) -- read "
                    "the whole document carefully and make your best good-faith "
                    "extraction of them rather than defaulting to null. Only "
                    "leave a field null if it is genuinely absent from the text, "
                    "not merely because you are not 100% certain of the exact "
                    "formatting.\n\n"
                    "IMPORTANT: PDF text extraction frequently scrambles layout "
                    "so that a field's VALUE appears earlier in the text than "
                    "its LABEL, often with several values grouped together on "
                    "one line followed by their matching labels grouped "
                    "together on a later line, e.g.:\n"
                    "  'Oct 13 2012  Standard Class  $3,922.53'\n"
                    "  'Date :  Ship Mode :  Balance Due :'\n"
                    "Here the first value belongs to the first label, the "
                    "second value to the second label, and so on -- match "
                    "them by their relative position and by what type of "
                    "value each label expects (a date, a shipping method, a "
                    "dollar amount), not by which text is physically closest. "
                    "The same pattern applies to summary totals (subtotal, "
                    "discount, shipping, total) and other label/value pairs -- "
                    "note that not every invoice has every summary line (e.g. "
                    "some have no discount), so match however many trailing "
                    "values there are to however many trailing labels there "
                    "are, in order; don't assume a fixed count. Use this "
                    "positional and semantic matching whenever labels and "
                    "values don't appear adjacent in the raw text.\n\n"
                    "IMPORTANT: right after a line item's amount, you will "
                    "often see a short line of extra product metadata (e.g. "
                    "category, sub-category, and a product/SKU code, such as "
                    "'Chairs, Furniture, FUR-CH-5378'). This describes the "
                    "item immediately above it -- it is NOT a second line "
                    "item, and it has no quantity/rate/amount of its own. "
                    "Never invent an extra item from it, and never treat the "
                    "summary values that follow it (subtotal, shipping, etc.) "
                    "as if they belonged to it. Count the real items in the "
                    "'Item Quantity Rate Amount' table carefully: there is "
                    "normally exactly one amount per item, and any numbers "
                    "left over afterward belong to the summary section, not "
                    "to an item.\n\n"
                    "Set confidence_score to reflect your overall certainty "
                    "about the extraction (0.0 to 1.0)."
                ),
            },
            {"role": "user", "content": raw_text},
        ],
        response_format=InvoiceData,
        # Langfuse-specific trace attributes -- shows up nicely in the dashboard
        name="extract-invoice-data",
        metadata={"raw_text_length": len(raw_text)},
    )

    parsed: InvoiceData = completion.choices[0].message.parsed

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