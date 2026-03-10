import os
import fitz

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"}


def get_file_type(path: str) -> str:
    ext = os.path.splitext(path)[1].lower()
    if ext == ".pdf":
        return "pdf"
    if ext in IMAGE_EXTS:
        return "image"
    return "unknown"


def extract_text_from_pdf(path: str) -> str:
    doc = fitz.open(path)
    try:
        parts = []
        for page in doc:
            text = page.get_text("text")
            if text and text.strip():
                parts.append(text)
        return "\n".join(parts).strip()
    finally:
        doc.close()


def extract_text_from_image(path: str) -> str:
    return "OCR is temporarily disabled on this deployment."


def extract_text_from_file(path: str) -> str:
    file_type = get_file_type(path)

    if file_type == "pdf":
        return extract_text_from_pdf(path)

    if file_type == "image":
        return extract_text_from_image(path)

    return ""
