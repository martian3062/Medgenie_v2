import os
import tempfile

import fitz
import easyocr

IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".webp", ".bmp", ".tiff", ".tif"}
_reader = None


def get_reader():
    global _reader
    if _reader is None:
        _reader = easyocr.Reader(["en"], gpu=False)
    return _reader


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
        parts = [page.get_text("text") for page in doc]
        text = "\n".join(parts).strip()

        if text:
            return text

        reader = get_reader()
        ocr_parts = []

        for i in range(len(doc)):
            page = doc.load_page(i)
            pix = page.get_pixmap(dpi=220)

            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name

            try:
                pix.save(tmp_path)
                result = reader.readtext(tmp_path, detail=0, paragraph=True)
                ocr_parts.append("\n".join(result))
            finally:
                if os.path.exists(tmp_path):
                    os.remove(tmp_path)

        return "\n".join(ocr_parts).strip()
    finally:
        doc.close()


def extract_text_from_image(path: str) -> str:
    reader = get_reader()
    result = reader.readtext(path, detail=0, paragraph=True)
    return "\n".join(result).strip()


def extract_text_from_file(path: str) -> str:
    file_type = get_file_type(path)

    if file_type == "pdf":
        return extract_text_from_pdf(path)

    if file_type == "image":
        return extract_text_from_image(path)

    return ""