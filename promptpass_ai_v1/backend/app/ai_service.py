import os
import json
import asyncio
from google import genai

api_key = os.getenv("GEMINI_API_KEY")
client = genai.Client(api_key=api_key) if api_key else None

# --- Used by main.py ---
async def stream_evaluation(question_text: str, options: dict, selected_answer: str):
    if not client: yield "[Error: GEMINI_API_KEY missing]\n\n"; return
    prompt = f"Analyze: {question_text}. Options: {options}. User Answer: {selected_answer}. Start with GRADE: CORRECT or GRADE: INCORRECT."
    async for chunk in await client.aio.models.generate_content_stream(model='gemini-2.0-flash', contents=prompt):
        if chunk.text: yield chunk.text

# --- Used by main.py ---
async def stream_chat(question_text: str, explanation: str, user_message: str):
    if not client: yield "[Error: GEMINI_API_KEY missing]\n\n"; return
    prompt = f"Question: {question_text}. Explanation: {explanation}. Student: {user_message}"
    async for chunk in await client.aio.models.generate_content_stream(model='gemini-2.0-flash', contents=prompt):
        if chunk.text: yield chunk.text

# --- Used by parser.py ---
async def parse_pdf_page_to_json(image_path: str):
    """Extract questions from PDF page using Gemini vision with error handling."""
    if not client: 
        print("[ERROR] Gemini client not initialized")
        return []
    
    try:
        with open(image_path, "rb") as f:
            image_data = f.read()
        
        prompt = '''Extract ALL questions from this PDF page as JSON list.
Return ONLY valid JSON with format:
[{"question_number": int, "text": "question", "options": {"A":"...", "B":"...", "C":"...", "D":"..."}, "correct_answer": "A"}]
If no questions, return: []'''
        
        response = await client.aio.models.generate_content(
            model='gemini-2.0-flash',
            contents=[{"mime_type": "image/jpeg", "data": image_data}, prompt]
        )
        
        response_text = response.text.strip().replace("```json", "").replace("```", "").strip()
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