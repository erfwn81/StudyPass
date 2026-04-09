from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.db import get_db
from app.models.exam import ExamSession, ExamAnswer
from app.models.question import Question
from app.schemas.progress import ProgressSummary, TopicBreakdown, ScoreTrend, WeakTopic
from app.services.auth import get_current_user_id

router = APIRouter(prefix="/progress", tags=["progress"])


@router.get("/summary", response_model=ProgressSummary)
def get_summary(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    sessions = db.query(ExamSession).filter(
        ExamSession.user_id == user_id,
        ExamSession.submitted_at.isnot(None),
    ).order_by(ExamSession.submitted_at).all()

    if not sessions:
        return ProgressSummary(
            total_exams=0,
            average_score=0,
            best_score=0,
            streak_days=0,
            score_trend=[],
            weak_topics=[],
        )

    percentages = [
        round(s.score / s.total_q * 100, 1)
        for s in sessions
        if s.score is not None and s.total_q > 0
    ]

    score_trend = [
        ScoreTrend(
            date=s.submitted_at.strftime("%Y-%m-%d"),
            score=s.score or 0,
            total=s.total_q,
            percentage=round(s.score / s.total_q * 100, 1) if s.score and s.total_q else 0,
            passed=s.passed or False,
        )
        for s in sessions
    ]

    # Calculate streak
    study_dates = sorted({s.submitted_at.date() for s in sessions}, reverse=True)
    streak = 0
    today = datetime.utcnow().date()
    for i, d in enumerate(study_dates):
        if d == today - timedelta(days=i):
            streak += 1
        else:
            break

    # Weak topics across all exams
    topic_stats: dict[str, dict] = {}
    all_answers = db.query(ExamAnswer).join(ExamSession).filter(
        ExamSession.user_id == user_id,
        ExamSession.submitted_at.isnot(None),
    ).all()

    for ans in all_answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue
        topic = q.topic or "General"
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "total": 0}
        topic_stats[topic]["total"] += 1
        if ans.is_correct:
            topic_stats[topic]["correct"] += 1

    weak_topics = sorted(
        [
            WeakTopic(
                topic=t,
                correct=s["correct"],
                total=s["total"],
                percentage=round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0,
            )
            for t, s in topic_stats.items()
        ],
        key=lambda x: x.percentage,
    )

    return ProgressSummary(
        total_exams=len(sessions),
        average_score=round(sum(percentages) / len(percentages), 1) if percentages else 0,
        best_score=max(percentages) if percentages else 0,
        streak_days=streak,
        score_trend=score_trend,
        weak_topics=weak_topics,
    )


@router.get("/topics", response_model=TopicBreakdown)
def get_topics(
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    topic_stats: dict[str, dict] = {}
    all_answers = db.query(ExamAnswer).join(ExamSession).filter(
        ExamSession.user_id == user_id,
        ExamSession.submitted_at.isnot(None),
    ).all()

    for ans in all_answers:
        q = db.query(Question).filter(Question.id == ans.question_id).first()
        if not q:
            continue
        topic = q.topic or "General"
        if topic not in topic_stats:
            topic_stats[topic] = {"correct": 0, "total": 0}
        topic_stats[topic]["total"] += 1
        if ans.is_correct:
            topic_stats[topic]["correct"] += 1

    topics = [
        WeakTopic(
            topic=t,
            correct=s["correct"],
            total=s["total"],
            percentage=round(s["correct"] / s["total"] * 100, 1) if s["total"] > 0 else 0,
        )
        for t, s in sorted(topic_stats.items())
    ]

    return TopicBreakdown(topics=topics)
