from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional
from datetime import datetime
from app.db import get_db
from app.models.exam import ExamSession, ExamAnswer
from app.models.question import Question
from app.models.course import Course
from app.schemas.exam import (
    ExamStart, ExamStartResponse, ExamSubmit,
    ExamResult, ExamHistory, ExamAnswerOut,
    ExamHistoryItem, TopicScore
)
from app.schemas.question import QuestionExam, QuestionOut
from app.services.auth import get_current_user_id

router = APIRouter(prefix="/exams", tags=["exams"])

MODE_QUESTION_COUNTS = {"full": 150, "quick": 25, "mini": 10, "half": 50}


@router.post("/start", response_model=ExamStartResponse)
def start_exam(
    data: ExamStart,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    course = db.query(Course).filter(Course.id == data.course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")

    count = data.question_count or MODE_QUESTION_COUNTS.get(data.mode, 25)

    q = db.query(Question).filter(Question.course_id == data.course_id)
    if data.topic:
        q = q.filter(Question.topic == data.topic)
    questions = q.order_by(func.random()).limit(count).all()

    if not questions:
        raise HTTPException(status_code=400, detail="No questions available for this selection")

    session = ExamSession(
        user_id=user_id,
        course_id=data.course_id,
        mode=data.mode,
        total_q=len(questions),
    )
    db.add(session)
    db.flush()

    for q in questions:
        db.add(ExamAnswer(session_id=session.id, question_id=q.id))

    db.commit()
    db.refresh(session)

    return ExamStartResponse(
        session_id=session.id,
        questions=[QuestionExam.model_validate(q) for q in questions],
        total=len(questions),
        mode=data.mode,
        started_at=session.started_at,
    )


@router.post("/{session_id}/submit", response_model=ExamResult)
def submit_exam(
    session_id: str,
    data: ExamSubmit,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id, ExamSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    if session.submitted_at:
        raise HTTPException(status_code=400, detail="Exam already submitted")

    answer_map = {a.question_id: a for a in session.answers}
    answer_input_map = {a.question_id: a for a in data.answers}

    score = 0
    topic_stats: dict[str, dict] = {}

    for q_id, exam_answer in answer_map.items():
        question = db.query(Question).filter(Question.id == q_id).first()
        user_ans = answer_input_map.get(q_id)

        user_answer_val = user_ans.answer.upper() if user_ans and user_ans.answer else None
        is_correct = user_answer_val == question.correct_answer if question.correct_answer else None
        flagged = user_ans.flagged if user_ans else False

        exam_answer.user_answer = user_answer_val
        exam_answer.is_correct = is_correct
        exam_answer.flagged = flagged

        if is_correct:
            score += 1

        topic = question.topic or "General"
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "total": 0}
        topic_stats[topic]["total"] += 1
        if is_correct:
            topic_stats[topic]["correct"] += 1

    total = len(answer_map)
    percentage = round(score / total * 100, 1) if total > 0 else 0
    passed = percentage >= session.course.passing_score

    session.submitted_at = datetime.utcnow()
    session.score = score
    session.passed = passed
    db.commit()

    topic_breakdown = [
        TopicScore(
            topic=t,
            correct=s["correct"],
            total=s["total"],
            percentage=round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0,
        )
        for t, s in sorted(topic_stats.items())
    ]

    answers_out = []
    for exam_answer in session.answers:
        q = db.query(Question).filter(Question.id == exam_answer.question_id).first()
        answers_out.append(ExamAnswerOut(
            question=QuestionOut.model_validate(q),
            user_answer=exam_answer.user_answer,
            is_correct=exam_answer.is_correct,
            flagged=exam_answer.flagged,
        ))

    return ExamResult(
        session_id=session_id,
        score=score,
        total=total,
        percentage=percentage,
        passed=passed,
        passing_score=session.course.passing_score,
        submitted_at=session.submitted_at,
        topic_breakdown=topic_breakdown,
        answers=answers_out,
    )


@router.get("/history", response_model=ExamHistory)
def get_history(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sessions = db.query(ExamSession).filter(
        ExamSession.user_id == user_id
    ).order_by(ExamSession.started_at.desc()).all()

    items = []
    for s in sessions:
        pct = round(s.score / s.total_q * 100, 1) if s.score is not None and s.total_q > 0 else None
        items.append(ExamHistoryItem(
            session_id=s.id,
            mode=s.mode,
            score=s.score,
            total_q=s.total_q,
            percentage=pct,
            passed=s.passed,
            started_at=s.started_at,
            submitted_at=s.submitted_at,
        ))

    return ExamHistory(exams=items, total=len(items))


@router.get("/{session_id}/results", response_model=ExamResult)
def get_results(
    session_id: str,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    session = db.query(ExamSession).filter(
        ExamSession.id == session_id, ExamSession.user_id == user_id
    ).first()
    if not session:
        raise HTTPException(status_code=404, detail="Exam session not found")
    if not session.submitted_at:
        raise HTTPException(status_code=400, detail="Exam not yet submitted")

    topic_stats: dict[str, dict] = {}
    answers_out = []

    for exam_answer in session.answers:
        q = db.query(Question).filter(Question.id == exam_answer.question_id).first()
        topic = q.topic or "General"
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "total": 0}
        topic_stats[topic]["total"] += 1
        if exam_answer.is_correct:
            topic_stats[topic]["correct"] += 1

        answers_out.append(ExamAnswerOut(
            question=QuestionOut.model_validate(q),
            user_answer=exam_answer.user_answer,
            is_correct=exam_answer.is_correct,
            flagged=exam_answer.flagged,
        ))

    topic_breakdown = [
        TopicScore(
            topic=t,
            correct=s["correct"],
            total=s["total"],
            percentage=round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0,
        )
        for t, s in sorted(topic_stats.items())
    ]

    total = session.total_q
    percentage = round(session.score / total * 100, 1) if session.score is not None and total > 0 else 0

    return ExamResult(
        session_id=session_id,
        score=session.score or 0,
        total=total,
        percentage=percentage,
        passed=session.passed or False,
        passing_score=session.course.passing_score,
        submitted_at=session.submitted_at,
        topic_breakdown=topic_breakdown,
        answers=answers_out,
    )
