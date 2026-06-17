import os
import fitz # PyMuPDF
import asyncio
from .ai_service import parse_pdf_page_to_json

def parse_question_pdf(file_path: str) -> list:
    print(f"\n[DEBUG] Starting extraction for file: {file_path}")
    
    doc = fitz.open(file_path)
    all_extracted_data = []

    for i in range(len(doc)):
        pix = doc.load_page(i).get_pixmap()
        img_path = f"temp_page_{i}.jpg"
        pix.save(img_path)
        
        try:
            print(f"[DEBUG] Processing page {i+1}...")
            page_data = asyncio.run(parse_pdf_page_to_json(img_path))
            print(f"[DEBUG] Page {i+1} AI Response: {page_data}")
            all_extracted_data.extend(page_data)
        finally:
            if os.path.exists(img_path): os.remove(img_path)
        
        # STOP CONDITION: If we have reached 2 questions, stop
        if len(all_extracted_data) >= 2:
            print(f"[DEBUG] Limit reached (2 questions). Stopping parser.")
            break
            
    doc.close()
    print(f"[DEBUG] Final list of questions extracted: {all_extracted_data}")
    return all_extracted_data[:2] # Ensure we return only 2