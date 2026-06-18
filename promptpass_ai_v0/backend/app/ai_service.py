import os
import json
from dotenv import load_dotenv
from openai import OpenAI

# --------------------------------------------------
# Load Environment Variables
# --------------------------------------------------

load_dotenv()

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

if not GITHUB_TOKEN:
    raise RuntimeError(
        "GITHUB_TOKEN is not configured. "
        "Please set it in your .env file."
    )

CHAT_MODEL = os.getenv(
    "CHAT_MODEL",
    "gpt-4o-mini"
)

EVALUATION_MODEL = os.getenv(
    "EVALUATION_MODEL",
    "gpt-4o-mini"
)

print(f"[AI] Using chat model: {CHAT_MODEL}")
print(f"[AI] Using evaluation model: {EVALUATION_MODEL}")

# --------------------------------------------------
# GitHub Models Client
# --------------------------------------------------

client = OpenAI(
    api_key=GITHUB_TOKEN,
    base_url="https://models.inference.ai.azure.com"
)

# --------------------------------------------------
# Generic Streaming Function
# --------------------------------------------------

async def generate_stream(
    prompt: str,
    model_name: str
):
    try:

        print(f"[AI] Using model: {model_name}")

        stream = client.chat.completions.create(
            model=model_name,
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
                and chunk.choices[0].delta
                and chunk.choices[0].delta.content
            ):
                yield chunk.choices[0].delta.content

    except Exception as e:

        print(
            f"[ERROR] GitHub Models stream failed "
            f"(model={model_name}) : {str(e)}"
        )

        yield (
            f"\n\n"
            f"[AI Error: {str(e)}]"
        )

# --------------------------------------------------
# Answer Evaluation
# --------------------------------------------------

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

Student Selected Answer:
{selected_answer}

Instructions:

1. Determine whether the answer is correct.
2. Start your response EXACTLY with:

GRADE: CORRECT

OR

GRADE: INCORRECT

3. Explain the reasoning.
4. Explain why other options are incorrect.
5. Mention the key concept tested.
6. Give one exam-preparation tip.

Use Markdown formatting.
"""

    async for chunk in generate_stream(
        prompt,
        EVALUATION_MODEL
    ):
        yield chunk

# --------------------------------------------------
# Follow-up Tutor Chat
# --------------------------------------------------

async def stream_chat(
    question_text: str,
    explanation: str,
    user_message: str
):
    prompt = f"""
You are an expert AI tutor helping a student.

Question:
{question_text}

Previous Explanation:
{explanation}

Student Follow-up Question:
{user_message}

Instructions:

- Answer clearly.
- Be concise.
- Use Markdown.
- Give examples when helpful.
- Focus on helping the student understand the concept.
"""

    async for chunk in generate_stream(
        prompt,
        CHAT_MODEL
    ):
        yield chunk