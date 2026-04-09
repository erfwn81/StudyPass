from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List
from app.schemas.question import QuestionExam, QuestionOut


class ExamStart(BaseModel):
    course_id: str
    mode: str = "full"  # full | quick | topic
    question_count: Optional[int] = None  # defaults by mode: full=150, quick=25
    topic: Optional[str] = None


class ExamStartResponse(BaseModel):
    session_id: str
    questions: List[QuestionExam]
    total: int
    mode: str
    started_at: datetime


class AnswerSubmit(BaseModel):
    question_id: str
    answer: Optional[str]  # A, B, C, D or null if skipped
    flagged: bool = False


class ExamSubmit(BaseModel):
    answers: List[AnswerSubmit]


class ExamAnswerOut(BaseModel):
    question: QuestionOut
    user_answer: Optional[str]
    is_correct: Optional[bool]
    flagged: bool

    class Config:
        from_attributes = True


class TopicScore(BaseModel):
    topic: str
    correct: int
    total: int
    percentage: float


class ExamResult(BaseModel):
    session_id: str
    score: int
    total: int
    percentage: float
    passed: bool
    passing_score: float
    submitted_at: datetime
    topic_breakdown: List[TopicScore]
    answers: List[ExamAnswerOut]


class ExamHistoryItem(BaseModel):
    session_id: str
    mode: str
    score: Optional[int]
    total_q: int
    percentage: Optional[float]
    passed: Optional[bool]
    started_at: datetime
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True


class ExamHistory(BaseModel):
    exams: List[ExamHistoryItem]
    total: int
