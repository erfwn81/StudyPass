import uuid
from datetime import datetime
from sqlalchemy import String, Text, Float, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db import Base


class Course(Base):
    __tablename__ = "courses"

    id: Mapped[str] = mapped_column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    state: Mapped[str | None] = mapped_column(String(50))
    passing_score: Mapped[float] = mapped_column(Float, default=70.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    questions: Mapped[list["Question"]] = relationship("Question", back_populates="course")  # noqa: F821
    exam_sessions: Mapped[list["ExamSession"]] = relationship("ExamSession", back_populates="course")  # noqa: F821
