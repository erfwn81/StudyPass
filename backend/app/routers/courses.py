from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from app.db import get_db
from app.models.course import Course
from app.models.question import Question
from app.schemas.course import CourseOut, CourseList

router = APIRouter(prefix="/courses", tags=["courses"])


@router.get("", response_model=CourseList)
def list_courses(db: Session = Depends(get_db)):
    courses = db.query(Course).all()
    result = []
    for c in courses:
        count = db.query(func.count(Question.id)).filter(Question.course_id == c.id).scalar()
        topics = [r[0] for r in db.query(distinct(Question.topic)).filter(
            Question.course_id == c.id, Question.topic.isnot(None)
        ).all()]
        out = CourseOut.model_validate(c)
        out.question_count = count
        out.topics = sorted(topics)
        result.append(out)
    return CourseList(courses=result, total=len(result))


@router.get("/{course_id}", response_model=CourseOut)
def get_course(course_id: str, db: Session = Depends(get_db)):
    course = db.query(Course).filter(Course.id == course_id).first()
    if not course:
        raise HTTPException(status_code=404, detail="Course not found")
    count = db.query(func.count(Question.id)).filter(Question.course_id == course_id).scalar()
    topics = [r[0] for r in db.query(distinct(Question.topic)).filter(
        Question.course_id == course_id, Question.topic.isnot(None)
    ).all()]
    out = CourseOut.model_validate(course)
    out.question_count = count
    out.topics = sorted(topics)
    return out
