import os
import re
import fitz # PyMuPDF
import pdfplumber
import asyncio
from typing import List, Dict, Any
from .ai_service import parse_pdf_text_to_json

try:
    import pytesseract
    from PIL import Image
    OCR_AVAILABLE = True
except ImportError:
    OCR_AVAILABLE = False


def _clean_text(text: str) -> str:
    return text.replace('\x00', ' ').strip()


def _extract_text_from_page(doc: fitz.Document, file_path: str, page_number: int) -> str:
    page = doc.load_page(page_number)
    page_text = page.get_text("text")
    if page_text and page_text.strip():
        return _clean_text(page_text)

    try:
        with pdfplumber.open(file_path) as pdf:
            text = pdf.pages[page_number].extract_text() or ""
            if text.strip():
                return _clean_text(text)
    except Exception as e:
        print(f"[DEBUG] pdfplumber fallback failed for page {page_number + 1}: {e}")

    if OCR_AVAILABLE:
        image_path = f"temp_ocr_page_{page_number}.png"
        try:
            pix = page.get_pixmap(dpi=200)
            pix.save(image_path)
            ocr_text = pytesseract.image_to_string(Image.open(image_path))
            if ocr_text and ocr_text.strip():
                return _clean_text(ocr_text)
        except Exception as e:
            print(f"[DEBUG] OCR failed for page {page_number + 1}: {e}")
        finally:
            if os.path.exists(image_path):
                os.remove(image_path)

    return ""


def _parse_questions_from_text(full_text: str) -> List[Dict[str, Any]]:
    parsed_questions: List[Dict[str, Any]] = []
    primary_regex = r'(?i)(?:\n|^)\s*Question\s*#\s*\d+'
    q_indices = [m.start() for m in re.finditer(primary_regex, full_text)]

    if len(q_indices) == 0:
        fallback_regex = r'(?:\n|^)(?:\d+[\.\:\-])\s+'
        q_indices = [m.start() for m in re.finditer(fallback_regex, full_text)]

    if len(q_indices) == 0:
        return []

    for i in range(len(q_indices)):
        start = q_indices[i]
        end = q_indices[i + 1] if i + 1 < len(q_indices) else len(full_text)
        q_block = full_text[start:end].strip()

        if re.search(r'(?i)Question\s*#\s*\d+', q_block):
            num_match = re.search(r'(?i)Question\s*#\s*(\d+)', q_block)
            if not num_match:
                continue
            q_num = int(num_match.group(1))
            q_block = re.sub(r'(?i)Question\s*#\s*\d+', '', q_block, count=1)
            q_block = re.sub(r'(?i)Topic\s*\d+[\s\-\w]*\n', '', q_block)
            q_block = re.sub(r'(?i)Topic\s*\d+', '', q_block)
        else:
            num_match = re.match(r'^(\d+)', q_block)
            if not num_match:
                continue
            q_num = int(num_match.group(1))
            q_block = re.sub(r'^\d+[\.\:\-]\s+', '', q_block, count=1)

        q_block = q_block.strip()
        options_pattern = r'(?:\n|^)\s*([A-F])[\.\)]\s+'
        parts = re.split(options_pattern, q_block)

        question_text = parts[0].strip()
        options: Dict[str, str] = {}

        for j in range(1, len(parts), 2):
            if j + 1 < len(parts):
                options[parts[j]] = parts[j + 1].strip().replace('\x00', '')

        if not options:
            options = {"TEXT": "Write your text response down below."}

        parsed_questions.append({
            "question_number": q_num,
            "text": question_text.replace('\x00', ''),
            "options": options,
        })

    return sorted(parsed_questions, key=lambda x: x["question_number"])


def parse_question_pdf(file_path: str) -> list:
    """Extract all questions from PDF using generic text extraction and AI fallback."""
    print(f"\n[DEBUG] Starting extraction for file: {file_path}")

    try:
        doc = fitz.open(file_path)
    except Exception as e:
        print(f"[ERROR] Unable to open PDF file: {e}")
        return []

    all_text = ""
    total_pages = len(doc)
    print(f"[DEBUG] Total pages to process: {total_pages}")

    for i in range(total_pages):
        print(f"[DEBUG] Extracting text from page {i+1}/{total_pages}...")
        page_text = _extract_text_from_page(doc, file_path, i)
        if page_text:
            all_text += page_text + "\n"
        else:
            print(f"[WARNING] Page {i+1} returned no text or OCR data.")

    doc.close()

    if not all_text.strip():
        print("[ERROR] No text could be extracted from the PDF. Check if the file is corrupted or if OCR is required.")
        return []

    extracted_questions = _parse_questions_from_text(all_text)
    if extracted_questions:
        print(f"[DEBUG] Parsed {len(extracted_questions)} questions using regex logic.")
        return extracted_questions

    print("[DEBUG] Regex parsing did not find questions. Falling back to AI-based extraction.")
    ai_questions = parse_pdf_text_to_json(all_text)
    if ai_questions:
        print(f"[DEBUG] AI fallback extracted {len(ai_questions)} questions.")
        return ai_questions

    print("[ERROR] No questions extracted from PDF after regex parsing and AI fallback.")
    return []