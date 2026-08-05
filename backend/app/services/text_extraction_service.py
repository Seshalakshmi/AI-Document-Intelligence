import io
from pathlib import Path

import fitz  # PyMuPDF -- renders PDF pages to images without needing poppler
import pytesseract
from PIL import Image
from pypdf import PdfReader
from docx import Document

from app.core.config import settings

# On Windows, Tesseract is a separate binary, not a pip package. If it's not
# on PATH, point pytesseract at it explicitly via TESSERACT_CMD in .env.
if settings.tesseract_cmd:
    pytesseract.pytesseract.tesseract_cmd = settings.tesseract_cmd

# A PDF page with fewer than this many extracted characters is treated as
# having no real text layer (i.e. a scanned/photographed page) and gets
# OCR'd instead of trusting the (empty/near-empty) native extraction.
MIN_CHARS_PER_PAGE = 20


def extract_text_from_txt(file_path: Path) -> str:
    return file_path.read_text(encoding="utf-8")


def ocr_image(image: Image.Image) -> str:
    return pytesseract.image_to_string(image)


def extract_text_from_image(file_path: Path) -> str:
    image = Image.open(file_path)
    return ocr_image(image).strip()


def extract_text_from_pdf(file_path: Path) -> str:
    """
    Extract text from a PDF. Pages with a real text layer use pypdf (fast).
    Pages with no usable text (scanned/image-only pages) are rendered to an
    image via PyMuPDF and OCR'd with pytesseract.
    """
    reader = PdfReader(str(file_path))
    text_parts: list[str | None] = []
    needs_ocr_pages: list[int] = []

    for i, page in enumerate(reader.pages):
        page_text = page.extract_text() or ""
        if len(page_text.strip()) >= MIN_CHARS_PER_PAGE:
            text_parts.append(page_text)
        else:
            text_parts.append(None)  # filled in by the OCR pass below
            needs_ocr_pages.append(i)

    if needs_ocr_pages:
        pdf_doc = fitz.open(str(file_path))
        for i in needs_ocr_pages:
            pix = pdf_doc[i].get_pixmap(dpi=300)  # higher dpi = better OCR accuracy
            image = Image.open(io.BytesIO(pix.tobytes("png")))
            text_parts[i] = ocr_image(image)
        pdf_doc.close()

    return "\n".join(part for part in text_parts if part)


def extract_text_from_docx(file_path: Path) -> str:
    doc = Document(str(file_path))
    paragraphs = []

    for paragraph in doc.paragraphs:
        if paragraph.text.strip():
            paragraphs.append(paragraph.text)

    return "\n".join(paragraphs)


def extract_text(file_path: Path, file_type: str) -> str:
    if file_type == ".txt":
        return extract_text_from_txt(file_path)

    if file_type == ".pdf":
        return extract_text_from_pdf(file_path)

    if file_type == ".docx":
        return extract_text_from_docx(file_path)

    if file_type in (".png", ".jpg", ".jpeg"):
        return extract_text_from_image(file_path)

    raise ValueError("Unsupported file type")
