from pydantic import BaseModel
from typing import List, Optional


class WeakTopic(BaseModel):
    topic: str
    correct: int
    total: int
    percentage: float


class ScoreTrend(BaseModel):
    date: str
    score: int
    total: int
    percentage: float
    passed: bool


class ProgressSummary(BaseModel):
    total_exams: int
    average_score: float
    best_score: float
    streak_days: int
    score_trend: List[ScoreTrend]
    weak_topics: List[WeakTopic]


class TopicBreakdown(BaseModel):
    topics: List[WeakTopic]
