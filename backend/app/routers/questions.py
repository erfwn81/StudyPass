from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from app.db import get_db
from app.models.question import Question
from app.schemas.question import QuestionOut, QuestionList

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=QuestionList)
def list_questions(
    course_id: Optional[str] = Query(None),
    topic: Optional[str] = Query(None),
    source: Optional[str] = Query(None),
    difficulty: Optional[str] = Query(None),
    limit: int = Query(50, le=500),
    offset: int = Query(0),
    random: bool = Query(False),
    db: Session = Depends(get_db),
):
    q = db.query(Question)
    if course_id:
        q = q.filter(Question.course_id == course_id)
    if topic:
        q = q.filter(Question.topic == topic)
    if source:
        q = q.filter(Question.source == source)
    if difficulty:
        q = q.filter(Question.difficulty == difficulty)

    total = q.count()

    if random:
        q = q.order_by(func.random())
    else:
        q = q.order_by(Question.created_at)

    questions = q.offset(offset).limit(limit).all()
    return QuestionList(questions=[QuestionOut.model_validate(q) for q in questions], total=total)


@router.get("/{question_id}", response_model=QuestionOut)
def get_question(question_id: str, db: Session = Depends(get_db)):
    question = db.query(Question).filter(Question.id == question_id).first()
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    return QuestionOut.model_validate(question)
