from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
import httpx
import json

router = APIRouter(prefix="/chat", tags=["chat"])

OLLAMA_URL = "http://localhost:11434"
MODEL = "llama3.2"

SYSTEM_PROMPT = """You are StudyPass AI, an expert tutor for the California Real Estate License Exam.
You help students understand real estate concepts, answer exam questions, and explain tricky topics.
Topics you cover: Agency Law, Contracts, Real Estate Finance, Property Ownership, Valuation,
Transfer of Property, Real Estate Practice, Fair Housing, Escrow, Title Insurance, and more.

Keep answers concise and focused on what a California real estate exam student needs to know.
When relevant, mention if something is commonly tested on the exam."""


class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None  # e.g. current question text


@router.post("")
async def chat(body: ChatMessage):
    prompt = body.message
    if body.context:
        prompt = f"Context (current question): {body.context}\n\nStudent question: {body.message}"

    payload = {
        "model": MODEL,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ],
        "stream": True,
    }

    async def generate():
        async with httpx.AsyncClient(timeout=120) as client:
            async with client.stream("POST", f"{OLLAMA_URL}/api/chat", json=payload) as resp:
                async for line in resp.aiter_lines():
                    if not line:
                        continue
                    try:
                        data = json.loads(line)
                        token = data.get("message", {}).get("content", "")
                        if token:
                            yield token
                        if data.get("done"):
                            break
                    except Exception:
                        continue

    return StreamingResponse(generate(), media_type="text/plain")
