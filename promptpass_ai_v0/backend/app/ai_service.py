import os
import json
import requests
import asyncio

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

# 1. The Main Evaluator
async def stream_evaluation(question_text: str, options: dict, selected_answer: str):
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
        async for chunk in _generate_with_ollama_stream(prompt):
            yield chunk
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"

# 2. The New Follow-Up Chat
async def stream_chat(question_text: str, explanation: str, user_message: str):
    prompt = (
        f"You are an AI tutor helping a student with a specific exam question.\n"
        f"Question Context: {question_text}\n"
        f"Your Previous Explanation: {explanation}\n\n"
        f"Student's Follow-up Question: {user_message}\n\n"
        f"Provide a helpful, concise answer using Markdown formatting."
    )
    
    try:
        async for chunk in _generate_with_ollama_stream(prompt):
            yield chunk
    except Exception as e:
        yield f"[AI Generation Error: {str(e)}]"