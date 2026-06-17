import os
import json
from google import genai

api_key = os.getenv("GEMINI_API_KEY")

if api_key:
    client = genai.Client(api_key=api_key)
else:
    client = None

# 1. The Main Evaluator
async def stream_evaluation(question_text: str, options: dict, selected_answer: str):
    if not client:
        yield "[Error: GEMINI_API_KEY is missing]\n\n"
        return

    prompt = (
        f"You are a strict grading evaluator. Examine this question:\n"
        f"Question: {question_text}\n"
        f"Available Options: {json.dumps(options)}\n"
        f"User Chosen Option: {selected_answer}\n\n"
        f"Instructions:\n"
        f"First, start your exact response with standard tracking structure: **GRADE: CORRECT** or **GRADE: INCORRECT**.\n"
        f"Then provide a thorough markdown verification explaining alternative logical errors step-by-step."
    )

    try:
        response_stream = await client.aio.models.generate_content_stream(model='gemini-2.0-flash', contents=prompt)
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text # We yield clean text, main.py will format it for streaming!
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"

# 2. The New Follow-Up Chat
async def stream_chat(question_text: str, explanation: str, user_message: str):
    if not client:
        yield "[Error: GEMINI_API_KEY is missing]\n\n"
        return

    prompt = (
        f"You are an AI tutor helping a student with a specific exam question.\n"
        f"Question Context: {question_text}\n"
        f"Your Previous Explanation: {explanation}\n\n"
        f"Student's Follow-up Question: {user_message}\n\n"
        f"Provide a helpful, concise answer using Markdown formatting."
    )
    
    try:
        response_stream = await client.aio.models.generate_content_stream(model='gemini-2.0-flash', contents=prompt)
        async for chunk in response_stream:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"