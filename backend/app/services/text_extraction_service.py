from pathlib import Path
from pypdf import PdfReader
from docx import Document

def extract_text_from_txt(file_path: Path) -> str:
    return file_path.read_text(encoding="utf-8")


def extract_text_from_pdf(file_path: Path) -> str:
    reader = PdfReader(str(file_path))
    text_parts = []

    for page in reader.pages:
        page_text = page.extract_text()
        if page_text:
            text_parts.append(page_text)

    return "\n".join(text_parts)


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

    raise ValueError("Unsupported file type")
    