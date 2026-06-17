import os
import fitz # PyMuPDF
import asyncio
from .ai_service import parse_pdf_page_to_json

def parse_question_pdf(file_path: str) -> list:
    """Extract all questions from PDF using AI vision and convert to JSON.
    
    Args:
        file_path: Path to the PDF file
        
    Returns:
        List of extracted questions with all questions from the PDF
    """
    print(f"\n[DEBUG] Starting extraction for file: {file_path}")
    
    doc = fitz.open(file_path)
    all_extracted_data = []
    total_pages = len(doc)
    print(f"[DEBUG] Total pages to process: {total_pages}")

    for i in range(total_pages):
        pix = doc.load_page(i).get_pixmap()
        img_path = f"temp_page_{i}.jpg"
        pix.save(img_path)
        
        try:
            print(f"[DEBUG] Processing page {i+1}/{total_pages}...")
            page_data = asyncio.run(parse_pdf_page_to_json(img_path))
            if page_data:
                print(f"[DEBUG] Page {i+1} extracted {len(page_data)} questions")
                all_extracted_data.extend(page_data)
            else:
                print(f"[DEBUG] Page {i+1}: No questions extracted")
        except Exception as e:
            print(f"[ERROR] Failed to process page {i+1}: {str(e)}")
        finally:
            if os.path.exists(img_path): 
                os.remove(img_path)
            
    doc.close()
    print(f"[DEBUG] Successfully extracted {len(all_extracted_data)} total questions")
    return all_extracted_data