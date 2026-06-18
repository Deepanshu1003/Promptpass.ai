import pdfplumber
import re
import os
import mimetypes
from typing import List, Dict, Any

# ---------------------------------------------------------------------------
# Supported MIME types
# ---------------------------------------------------------------------------

SUPPORTED_MIME_TYPES = {
    "application/pdf": "pdf",
    "text/plain": "txt",
}

SUPPORTED_EXTENSIONS = {
    ".pdf": "pdf",
    ".txt": "txt",
    ".text": "txt",
}

# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

def parse_question_pdf(file_path: str) -> List[Dict[str, Any]]:
    """
    Parse questions from a supported file (PDF or TXT).
    Raises ValueError with a human-readable message for unsupported formats.
    """
    print(f"\n[PARSER] Initiating extraction for: {file_path}")

    file_type = _detect_file_type(file_path)
    print(f"[PARSER] Detected file type: {file_type}")

    if file_type == "pdf":
        raw_text = _extract_text_from_pdf(file_path)
    elif file_type == "txt":
        raw_text = _extract_text_from_txt(file_path)
    else:
        ext = os.path.splitext(file_path)[1].lower()
        raise ValueError(
            f"Unsupported file format '{ext}'. "
            "Please upload a PDF (.pdf) or plain-text (.txt) file."
        )

    return _parse_questions_from_text(raw_text)


# ---------------------------------------------------------------------------
# File-type detection
# ---------------------------------------------------------------------------

def _detect_file_type(file_path: str) -> str:
    """
    Determine file type using both MIME sniffing and extension fallback.
    Returns a canonical type string ('pdf', 'txt') or 'unknown'.
    """
    # 1. Extension-based detection (fast, reliable for well-named files)
    ext = os.path.splitext(file_path)[1].lower()
    if ext in SUPPORTED_EXTENSIONS:
        return SUPPORTED_EXTENSIONS[ext]

    # 2. MIME-type detection via mimetypes stdlib
    mime_type, _ = mimetypes.guess_type(file_path)
    if mime_type and mime_type in SUPPORTED_MIME_TYPES:
        return SUPPORTED_MIME_TYPES[mime_type]

    # 3. Magic-byte sniffing as final fallback
    try:
        with open(file_path, "rb") as f:
            header = f.read(8)
        if header.startswith(b"%PDF"):
            return "pdf"
        # UTF-8 / ASCII text heuristic — no NUL bytes in first 512 bytes
        with open(file_path, "rb") as f:
            sample = f.read(512)
        if b"\x00" not in sample:
            return "txt"
    except OSError:
        pass

    return "unknown"


# ---------------------------------------------------------------------------
# Text extractors
# ---------------------------------------------------------------------------

def _extract_text_from_pdf(file_path: str) -> str:
    full_text = ""
    try:
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"[PARSER] PDF opened — {total_pages} page(s).")
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    # Strip NUL bytes that crash PostgreSQL
                    full_text += text.replace("\x00", "") + "\n"
                else:
                    print(f"[PARSER] WARNING: Page {i + 1} returned no text.")
    except Exception as e:
        print(f"[PARSER] CRITICAL ERROR opening PDF: {e}")
        raise ValueError(
            "The PDF could not be read. It may be encrypted, corrupted, "
            "or a scanned image without embedded text."
        ) from e
    return full_text


def _extract_text_from_txt(file_path: str) -> str:
    print("[PARSER] Reading plain-text file.")
    encodings = ["utf-8", "utf-8-sig", "latin-1", "cp1252"]
    for enc in encodings:
        try:
            with open(file_path, "r", encoding=enc) as f:
                return f.read().replace("\x00", "")
        except (UnicodeDecodeError, LookupError):
            continue
    raise ValueError(
        "The text file could not be decoded. "
        "Please save it as UTF-8 and try again."
    )


# ---------------------------------------------------------------------------
# Question parser (shared across formats)
# ---------------------------------------------------------------------------

def _parse_questions_from_text(full_text: str) -> List[Dict[str, Any]]:
    if not full_text.strip():
        print("[PARSER] ERROR: Extracted text is empty.")
        return []

    # Primary: "Question #N" format
    primary_regex = r"(?i)(?:\n|^)\s*Question\s*#\s*\d+"
    q_indices = [m.start() for m in re.finditer(primary_regex, full_text)]
    print(f"[PARSER] Primary regex found {len(q_indices)} question boundaries.")

    # Fallback: "1. " / "1) " / "1- " format
    if not q_indices:
        fallback_regex = r"(?:\n|^)(?:\d+[\.\:\x2d])\s+"
        q_indices = [m.start() for m in re.finditer(fallback_regex, full_text)]
        print(f"[PARSER] Fallback regex found {len(q_indices)} question boundaries.")

    if not q_indices:
        print("[PARSER] ERROR: No question boundaries detected.")
        return []

    parsed_questions: List[Dict[str, Any]] = []

    for i in range(len(q_indices)):
        start = q_indices[i]
        end = q_indices[i + 1] if i + 1 < len(q_indices) else len(full_text)
        q_block = full_text[start:end].strip()

        # --- Determine question number & clean headers ---
        if re.search(r"(?i)Question\s*#\s*\d+", q_block):
            num_match = re.search(r"(?i)Question\s*#\s*(\d+)", q_block)
            if not num_match:
                continue
            q_num = int(num_match.group(1))
            q_block = re.sub(r"(?i)Question\s*#\s*\d+", "", q_block, count=1)
            q_block = re.sub(r"(?i)Topic\s*\d+[\s\-\w]*\n", "", q_block)
            q_block = re.sub(r"(?i)Topic\s*\d+", "", q_block)
        else:
            num_match = re.match(r"^(\d+)", q_block)
            if not num_match:
                continue
            q_num = int(num_match.group(1))
            q_block = re.sub(r"^\d+[\.\:\x2d]\s+", "", q_block, count=1)

        q_block = q_block.strip()

        # --- Split into question text + options ---
        options_pattern = r"(?:\n|^)\s*([A-F])[\.\)]\s+"
        parts = re.split(options_pattern, q_block)

        question_text = parts[0].strip().replace("\x00", "")
        options: Dict[str, str] = {}

        for j in range(1, len(parts), 2):
            if j + 1 < len(parts):
                options[parts[j]] = parts[j + 1].strip().replace("\x00", "")

        if i == 0:
            print(f"[PARSER] Q{q_num} text preview: {question_text[:80]}…")
            print(f"[PARSER] Q{q_num} options: {list(options.keys())}")

        parsed_questions.append({
            "question_number": q_num,
            "text": question_text,
            "options": options if options else {"TEXT": "Write your text response below."},
        })

    print(f"[PARSER] Compiled {len(parsed_questions)} questions.")
    return sorted(parsed_questions, key=lambda x: x["question_number"])