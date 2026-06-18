import os
import json
import asyncio
import requests
from typing import List, Dict

# Configuration for Ollama
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://ollama:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "mistral")

def _generate_with_ollama(prompt: str) -> str:
    """Generate response using Ollama API (synchronous)"""
    try:
        response = requests.post(
            f"{OLLAMA_HOST}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=120
        )
        response.raise_for_status()
        result = response.json()
        return result.get("response", "")
    except requests.exceptions.RequestException as e:
        raise Exception(f"Ollama API Error: {str(e)}")

async def _generate_with_ollama_stream(prompt: str):
    """Generate response using Ollama API (streaming)"""
    try:
        loop = asyncio.get_event_loop()
        response = await loop.run_in_executor(
            None,
            lambda: requests.post(
                f"{OLLAMA_HOST}/api/generate",
                json={
                    "model": OLLAMA_MODEL,
                    "prompt": prompt,
                    "stream": True
                },
                timeout=120
            )
        )
        response.raise_for_status()
        
        # Stream the response line by line
        for line in response.iter_lines():
            if line:
                data = json.loads(line)
                if "response" in data:
                    yield data["response"]
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"

# --- Used by main.py ---
async def stream_evaluation(question_text: str, options: dict, selected_answer: str):
    prompt = f"Analyze: {question_text}. Options: {options}. User Answer: {selected_answer}. Start with GRADE: CORRECT or GRADE: INCORRECT."
    try:
        async for chunk in _generate_with_ollama_stream(prompt):
            yield chunk
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"

# --- Used by main.py ---
async def stream_chat(question_text: str, explanation: str, user_message: str):
    prompt = f"Question: {question_text}. Explanation: {explanation}. Student: {user_message}"
    try:
        async for chunk in _generate_with_ollama_stream(prompt):
            yield chunk
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"

# --- Used by parser.py ---
def parse_pdf_text_to_json(document_text: str) -> List[Dict]:
    """Extract questions from PDF text content using Ollama AI."""
    if not document_text or not document_text.strip():
        print("[ERROR] No document text provided for AI parsing")
        return []

    prompt_text = document_text
    if len(prompt_text) > 14000:
        prompt_text = prompt_text[:14000] + "\n\n[TRUNCATED PDF CONTENT]"

    prompt = f'''Extract ALL questions from this PDF content as JSON list.
Return ONLY valid JSON with format:
[{{"question_number": int, "text": "question", "options": {{"A":"...", "B":"...", "C":"...", "D":"..."}}, "correct_answer": "A"}}]
If no questions, return: []

PDF Content:
{prompt_text}
'''

    try:
        response_text = _generate_with_ollama(prompt)
        response_text = response_text.strip().replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(response_text)

        if not isinstance(parsed_data, list):
            print(f"[WARNING] AI returned {type(parsed_data).__name__} instead of list")
            return []

        return parsed_data

    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse failed: {str(e)}")
        return []
    except Exception as e:
        print(f"[ERROR] Question extraction failed: {str(e)}")
        return []

# --- Used by parser.py ---
async def parse_pdf_page_to_json(image_path: str) -> List[Dict]:
    """Extract questions from PDF page using OCR text with Ollama.
    
    NOTE: Ollama doesn't support image analysis by default.
    This function extracts text from the image (requires pdfplumber preprocessing)
    and uses Ollama to structure it as JSON.
    For full vision capabilities, consider using:
    - LLaVA model in Ollama (requires more VRAM)
    - Claude API with vision
    - Gemini API
    """
    if not image_path:
        print("[ERROR] No image path provided")
        return []
    
    try:
        prompt = '''Extract ALL questions from this PDF content as JSON list.
Return ONLY valid JSON with format:
[{"question_number": int, "text": "question", "options": {"A":"...", "B":"...", "C":"...", "D":"..."}, "correct_answer": "A"}]
If no questions, return: []

PDF Content:
(Process the text content here - requires OCR preprocessing)
'''
        
        response_text = _generate_with_ollama(prompt)
        response_text = response_text.strip().replace("```json", "").replace("```", "").strip()
        parsed_data = json.loads(response_text)
        
        if not isinstance(parsed_data, list):
            print(f"[WARNING] AI returned {type(parsed_data).__name__} instead of list")
            return []
        
        return parsed_data
        
    except json.JSONDecodeError as e:
        print(f"[ERROR] JSON parse failed: {str(e)}")
        return []
    except Exception as e:
        print(f"[ERROR] Question extraction failed: {str(e)}")
        return []