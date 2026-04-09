from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import httpx
from app.db import get_db
from app.models.question import Question
from app.config import settings
from pydantic import BaseModel

router = APIRouter(prefix="/explain", tags=["explain"])

OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"

PROMPT = """You are a California Real Estate exam tutor. Explain in 2-4 sentences why the correct answer is right and why the other options are wrong.

Question: {question}
A. {option_a}
B. {option_b}
C. {option_c}
D. {option_d}
Correct Answer: {correct_answer}. {correct_text}

Write only the explanation, starting directly with the reasoning."""


class ExplainResponse(BaseModel):
    question_id: str
    explanation: str
    generated: bool  # True = freshly generated, False = from DB


@router.get("/{question_id}", response_model=ExplainResponse)
async def get_explanation(question_id: str, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")

    # Return cached explanation from DB
    if question.explanation:
        return ExplainResponse(
            question_id=question_id,
            explanation=question.explanation,
            generated=False,
        )

    if not question.correct_answer:
        raise HTTPException(status_code=400, detail="Question has no correct answer set")

    # Generate via Ollama
    opt_map = {"A": question.option_a, "B": question.option_b,
               "C": question.option_c, "D": question.option_d}
    correct_text = opt_map.get(question.correct_answer, "") or ""

    prompt = PROMPT.format(
        question=question.question_text,
        option_a=question.option_a or "",
        option_b=question.option_b or "",
        option_c=question.option_c or "",
        option_d=question.option_d or "",
        correct_answer=question.correct_answer,
        correct_text=correct_text,
    )

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            r = await client.post(
                f"{OLLAMA_URL}/api/generate",
                json={
                    "model": DEFAULT_MODEL,
                    "prompt": prompt,
                    "stream": False,
                    "options": {"temperature": 0.3, "num_predict": 200},
                },
            )
            if r.status_code != 200:
                raise HTTPException(status_code=503, detail="Ollama unavailable")

            explanation = r.json().get("response", "").strip()
            if not explanation:
                raise HTTPException(status_code=503, detail="Empty response from LLM")

            # Cache it in the DB
            question.explanation = explanation
            db.commit()

            return ExplainResponse(
                question_id=question_id,
                explanation=explanation,
                generated=True,
            )

    except httpx.ConnectError:
        raise HTTPException(
            status_code=503,
            detail="Ollama not running. Start with: ollama serve",
        )
