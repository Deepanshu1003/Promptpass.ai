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
    if not client: return []
    with open(image_path, "rb") as f:
        image_data = f.read()
    
    prompt = 'Extract questions as JSON list: [{"question_number": int, "text": "str", "options": {"A":"...", "B":"..."}, "correct_answer": "str"}]'
    
    response = await client.aio.models.generate_content(
        model='gemini-2.0-flash',
        contents=[{"mime_type": "image/jpeg", "data": image_data}, prompt]
    )
    return json.loads(response.text.replace("```json", "").replace("```", "").strip())