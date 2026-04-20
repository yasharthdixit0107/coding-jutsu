import fitz
from docx import Document
from io import BytesIO

def extract_from_pdf(file_bytes: bytes) -> str:
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text()
        return text
    except Exception:
        return ""

def extract_from_docx(file_bytes: bytes) -> str:
    try:
        doc = Document(BytesIO(file_bytes))
        return "\n".join([para.text for para in doc.paragraphs])
    except Exception:
        return ""

def extract_from_txt(file_bytes: bytes) -> str:
    try:
        return file_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def get_text_from_file(filename: str, file_bytes: bytes) -> str:
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        return extract_from_pdf(file_bytes)
    elif filename_lower.endswith(".docx"):
        return extract_from_docx(file_bytes)
    elif filename_lower.endswith(".txt"):
        return extract_from_txt(file_bytes)
    return ""
