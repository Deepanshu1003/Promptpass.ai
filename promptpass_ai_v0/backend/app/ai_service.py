import os
import json
from openai import OpenAI
from dotenv import load_dotenv

# load .env file if it exists
load_dotenv()

# OpenRouter Configuration
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

MODEL = os.getenv(
    "OPENROUTER_MODEL",
    "deepseek/deepseek-r1:free"
)

client = OpenAI(
    api_key=OPENROUTER_API_KEY,
    base_url="https://openrouter.ai/api/v1"
)


def generate_response(prompt: str) -> str:
    """
    Synchronous OpenRouter call
    """

    try:
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2
        )

        return response.choices[0].message.content

    except Exception as e:
        print(f"[ERROR] OpenRouter sync failed: {str(e)}")
        raise


async def generate_stream(prompt: str):
    """
    Streaming OpenRouter call
    """

    try:

        stream = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            temperature=0.2,
            stream=True
        )

        for chunk in stream:

            if (
                chunk.choices
                and chunk.choices[0].delta.content
            ):
                yield chunk.choices[0].delta.content

    except Exception as e:

        print(f"[ERROR] OpenRouter stream failed: {str(e)}")
        yield f"\n\n[AI Error: {str(e)}]"


# ---------------------------------------------------
# Evaluation
# ---------------------------------------------------

async def stream_evaluation(
    question_text: str,
    options: dict,
    selected_answer: str
):

    prompt = f"""
You are an expert competitive-exam evaluator.

Question:
{question_text}

Options:
{json.dumps(options, indent=2)}

Student Selected:
{selected_answer}

Tasks:

1. Determine whether the answer is correct.
2. Start with EXACTLY one of:

GRADE: CORRECT

or

GRADE: INCORRECT

3. Explain the reasoning.
4. Explain why other options are wrong.
5. Mention the key concept tested.
6. Give one exam tip.

Use Markdown formatting.
"""

    async for chunk in generate_stream(prompt):
        yield chunk


# ---------------------------------------------------
# Chat
# ---------------------------------------------------

async def stream_chat(
    question_text: str,
    explanation: str,
    user_message: str
):

    prompt = f"""
You are an AI tutor.

Question:
{question_text}

Previous Explanation:
{explanation}

Student Follow-Up Question:
{user_message}

Instructions:

- Be educational.
- Use markdown.
- Keep responses concise.
- Give examples if useful.
"""

    async for chunk in generate_stream(prompt):
        yield chunk