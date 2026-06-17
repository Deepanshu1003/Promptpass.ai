import pdfplumber
import re
from typing import List, Dict, Any

def parse_question_pdf(file_path: str) -> List[Dict[str, Any]]:
    print(f"\n[PARSER] Initiating PDF extraction for: {file_path}")
    parsed_questions = []
    full_text = ""
    
    try:
        with pdfplumber.open(file_path) as pdf:
            total_pages = len(pdf.pages)
            print(f"[PARSER] Successfully opened PDF. Total pages found: {total_pages}")
            
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                if text:
                    # CRITICAL FIX: Strip out NUL bytes that crash PostgreSQL
                    clean_text = text.replace('\x00', '')
                    full_text += clean_text + "\n"
                else:
                    print(f"[PARSER] WARNING: Page {i+1} returned no text.")
                    
    except Exception as e:
        print(f"[PARSER] CRITICAL ERROR opening PDF: {str(e)}")
        return []

    # First, try to find questions formatted as "Question #1", "Question #2"
    primary_regex = r'(?i)(?:\n|^)\s*Question\s*#\s*\d+'
    print(f"[PARSER] Searching for questions using Primary Regex: {primary_regex}")
    
    q_indices = [m.start() for m in re.finditer(primary_regex, full_text)]
    print(f"[PARSER] Found {len(q_indices)} question boundaries.")
    
    # If the PDF doesn't use "Question #", fall back to standard "1. " format
    if len(q_indices) == 0:
        fallback_regex = r'(?:\n|^)(?:\d+[\.\:\x2d])\s+'
        q_indices = [m.start() for m in re.finditer(fallback_regex, full_text)]
        print(f"[PARSER] Primary failed. Fallback regex found {len(q_indices)} question boundaries.")
        if len(q_indices) == 0:
            print("[PARSER] ERROR: Regex found 0 questions. File format is unrecognized.")
            return []

    for i in range(len(q_indices)):
        start = q_indices[i]
        end = q_indices[i+1] if i + 1 < len(q_indices) else len(full_text)
        q_block = full_text[start:end].strip()
        
        # Determine the question number and clean the text block
        if 'Question #' in q_block or 'QUESTION #' in q_block.upper():
            num_match = re.search(r'(?i)Question\s*#\s*(\d+)', q_block)
            if not num_match: continue
            q_num = int(num_match.group(1))
            
            # Remove the "Question #X" and "Topic X" headers so they don't appear in React
            q_block = re.sub(r'(?i)Question\s*#\s*\d+', '', q_block, count=1)
            q_block = re.sub(r'(?i)Topic\s*\d+[\s\-\w]*\n', '', q_block)
            q_block = re.sub(r'(?i)Topic\s*\d+', '', q_block) 
        else:
            num_match = re.match(r'^(\d+)', q_block)
            if not num_match: continue
            q_num = int(num_match.group(1))
            # Remove the "1. " number prefix
            q_block = re.sub(r'^\d+[\.\:\x2d]\s+', '', q_block, count=1)
            
        q_block = q_block.strip()
        
        # Parse text and extract multiple-choice variations (A., B., C., D., E., F.)
        options_pattern = r'(?:\n|^)\s*([A-F])[\.\)]\s+'
        parts = re.split(options_pattern, q_block)
        
        question_text = parts[0].strip()
        options = {}
        
        for j in range(1, len(parts), 2):
            if j + 1 < len(parts):
                # Apply one last deep-clean to the options text just in case
                options[parts[j]] = parts[j+1].strip().replace('\x00', '')
                
        if i == 0:
             print(f"[PARSER] Q{q_num} Text extracted: {question_text[:80]}...")
             print(f"[PARSER] Q{q_num} Options extracted: {list(options.keys())}")
                
        parsed_questions.append({
            "question_number": q_num,
            # Apply one last deep-clean to the question text
            "text": question_text.replace('\x00', ''),
            "options": options if options else {"TEXT": "Write your text response down below."}
        })
        
    print(f"[PARSER] Successfully compiled {len(parsed_questions)} questions into memory.")
    return sorted(parsed_questions, key=lambda x: x['question_number'])