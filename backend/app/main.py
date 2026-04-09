from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.routers import auth, courses, questions, exams, progress
from app.routers import explain
from app.routers import chat

app = FastAPI(
    title="StudyPass API",
    description="California Real Estate License Exam Prep",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(courses.router)
app.include_router(questions.router)
app.include_router(exams.router)
app.include_router(progress.router)
app.include_router(explain.router)
app.include_router(chat.router)


@app.get("/health")
def health():
    return {"status": "ok", "version": "1.0.0"}
