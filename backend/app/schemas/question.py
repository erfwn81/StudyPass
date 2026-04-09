from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class QuestionOut(BaseModel):
    id: str
    course_id: str
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    correct_answer: Optional[str] = None  # hidden during exam, shown in results
    explanation: Optional[str] = None
    topic: Optional[str]
    difficulty: str
    source: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionExam(BaseModel):
    """Question without correct answer - used during active exam"""
    id: str
    course_id: str
    question_text: str
    option_a: Optional[str]
    option_b: Optional[str]
    option_c: Optional[str]
    option_d: Optional[str]
    topic: Optional[str]
    difficulty: str

    class Config:
        from_attributes = True


class QuestionList(BaseModel):
    questions: List[QuestionOut]
    total: int
