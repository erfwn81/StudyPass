from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List


class CourseOut(BaseModel):
    id: str
    name: str
    description: Optional[str]
    state: Optional[str]
    passing_score: float
    created_at: datetime
    question_count: Optional[int] = None
    topics: Optional[List[str]] = None

    class Config:
        from_attributes = True


class CourseList(BaseModel):
    courses: List[CourseOut]
    total: int
