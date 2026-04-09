#!/usr/bin/env python3
"""
StudyPass Question Ingest Pipeline
===================================
Parses 4 PDF source files and seeds the PostgreSQL database.

Sources:
  1. Real Estate Finance Booklet.pdf       — 200 questions, answer key at end
  2. Real Estate Practice Booklet.pdf      — 200 questions, answer key at end
  3. Real Estate Principles Booklet.pdf    — 200 questions, answer key at end
  4. Real_Estate_Exam_Professionals_Ltd_2021_California_Real_Estate_Exam.pdf
     — Study Section: questions + answers + explanations, multiple topics
"""

import os
import re
import sys
import uuid
from pathlib import Path
from typing import Optional

# Allow running from backend/ or backend/scripts/
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pdfplumber
from sqlalchemy.orm import Session
from app.db import SessionLocal, engine
from app.models.course import Course
from app.models.question import Question
from app.db import Base

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------

PDF_DIR = Path(__file__).resolve().parent.parent.parent  # project root

REVEI_SOURCES = [
    {
        "path": PDF_DIR / "Real Estate Finance Booklet.pdf",
        "topic": "Real Estate Finance",
        "source_name": "Revei Finance Booklet",
    },
    {
        "path": PDF_DIR / "Real Estate Practice Booklet.pdf",
        "topic": "Real Estate Practice",
        "source_name": "Revei Practice Booklet",
    },
    {
        "path": PDF_DIR / "Real Estate Principles Booklet.pdf",
        "topic": "Real Estate Principles",
        "source_name": "Revei Principles Booklet",
    },
]

EXAM_PREP_PDF = PDF_DIR / "Real_Estate_Exam_Professionals_Ltd_2021_California_Real_Estate_Exam.pdf"

# Topic keywords for classification in the large PDF
TOPIC_KEYWORDS = {
    "Agency Law": ["agency", "fiduciary", "principal", "broker", "agent", "dual agent", "listing agreement"],
    "Contracts": ["contract", "offer", "acceptance", "consideration", "escrow", "contingency", "novation", "rescission"],
    "Finance": ["loan", "mortgage", "interest rate", "amortize", "ltv", "fha", "va", "trust deed", "lien", "usury", "appraisal", "points"],
    "Property Ownership": ["fee simple", "title", "deed", "ownership", "estate", "easement", "encumbrance", "zoning", "subdivision"],
    "Transfer of Property": ["transfer", "grant deed", "quitclaim", "probate", "foreclosure", "recording", "title insurance"],
    "Real Estate Practice": ["listing", "mls", "commission", "salesperson", "license", "disclosure", "fair housing", "advertisement"],
    "Valuation": ["appraisal", "market value", "cap rate", "depreciation", "income approach", "comparable", "assessment"],
    "Math": ["calculate", "percent", "commission", "prorate", "square feet", "$", "payment", "interest"],
}


def classify_topic(question_text: str, default_topic: str) -> str:
    """Assign a topic based on question text keywords."""
    text_lower = question_text.lower()
    for topic, keywords in TOPIC_KEYWORDS.items():
        if any(kw in text_lower for kw in keywords):
            return topic
    return default_topic


# ---------------------------------------------------------------------------
# Revei Booklet Parser
# ---------------------------------------------------------------------------

def parse_revei_booklet(pdf_path: Path) -> tuple[list[dict], dict[int, str]]:
    """
    Returns (questions_list, answer_key_dict).
    questions_list: [{number, question_text, options: {a,b,c,d}}]
    answer_key_dict: {1: 'a', 2: 'c', ...}
    """
    full_text = ""
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page in pdf.pages:
            text = page.extract_text() or ""
            full_text += text + "\n"

    # Split into question section and answer key section
    answer_key_idx = full_text.lower().find("answer key")
    if answer_key_idx == -1:
        question_text_section = full_text
        answer_key_text = ""
    else:
        question_text_section = full_text[:answer_key_idx]
        answer_key_text = full_text[answer_key_idx:]

    # Parse answer key: lines can have multiple answers per line
    # Format: "1. a  43. b  85. d" or "1. a\n2. c"
    answer_key: dict[int, str] = {}
    for match in re.finditer(r"(\d+)\.\s+([a-d])", answer_key_text, re.IGNORECASE):
        answer_key[int(match.group(1))] = match.group(2).upper()

    # Parse questions
    questions = _parse_revei_questions(question_text_section)
    return questions, answer_key


def _parse_revei_questions(text: str) -> list[dict]:
    """
    Parse numbered questions with a/b/c/d options from Revei booklet text.
    Questions start with a number followed by a period or dot.
    """
    questions = []

    # Split on question numbers (e.g. "1. " or "1 ." at start of line)
    # The pattern handles both "1. Question" and "1.\n    Question"
    question_pattern = re.compile(
        r"(?:^|\n)(\d{1,3})\.\s+(.+?)(?=\n\d{1,3}\.\s|\Z)",
        re.DOTALL,
    )

    for match in question_pattern.finditer(text):
        num = int(match.group(1))
        block = match.group(2).strip()

        # Split out options a/b/c/d from the block
        options = {}
        option_pattern = re.compile(
            r"\n\s*([a-d])\.\s+(.+?)(?=\n\s*[a-d]\.\s|\Z)",
            re.DOTALL | re.IGNORECASE,
        )

        # Find first option position
        first_opt = option_pattern.search(block)
        if first_opt:
            question_body = block[:first_opt.start()].strip()
            for opt_match in option_pattern.finditer(block):
                letter = opt_match.group(1).lower()
                option_text = opt_match.group(2).strip().replace("\n", " ")
                option_text = re.sub(r"\s+", " ", option_text)
                options[letter] = option_text
        else:
            question_body = block.strip()

        question_body = re.sub(r"\s+", " ", question_body.replace("\n", " ")).strip()

        if question_body and len(options) >= 2:
            questions.append({
                "number": num,
                "question_text": question_body,
                "options": options,
            })

    return questions


# ---------------------------------------------------------------------------
# Large PDF (Exam Prep) Parser — Study Section
# ---------------------------------------------------------------------------

# Topics present in the Study Section (from Table of Contents)
EXAM_PREP_TOPICS = [
    "Real Estate Vocabulary",
    "Diagnostic Pre-Test",
    "Property Ownership",
    "Agency and Contracts",
    "Valuation and Market Analysis",
    "Finance (Real Estate Math)",
    "Transfer of Property",
    "Real Estate Practice",
    "Diagnostic Post-Test",
]

# Map PDF section names to shorter topic tags
TOPIC_MAP = {
    "Real Estate Vocabulary": "Vocabulary",
    "Diagnostic Pre-Test": "Diagnostic",
    "Property Ownership": "Property Ownership",
    "Agency and Contracts": "Agency and Contracts",
    "Valuation and Market Analysis": "Valuation",
    "Finance (Real Estate Math)": "Finance",
    "Transfer of Property": "Transfer of Property",
    "Real Estate Practice": "Real Estate Practice",
    "Diagnostic Post-Test": "Diagnostic",
}


def parse_exam_prep_pdf(pdf_path: Path) -> list[dict]:
    """
    Parse the Study Section of the large PDF.
    Each question block looks like:

        N. Question text in bold:

        A. option
        B. option
        C. option
        D. option

        Answer: X. Explanation text.

    Returns list of dicts with question data.
    """
    # Extract text from Study Section only (skip Test Section duplicate)
    full_text = ""
    study_section_started = False
    test_section_started = False

    with pdfplumber.open(str(pdf_path)) as pdf:
        total_pages = len(pdf.pages)
        print(f"  Large PDF: {total_pages} pages total, extracting Study Section...")

        for i, page in enumerate(pdf.pages):
            text = page.extract_text() or ""

            if "Study Section" in text and not study_section_started:
                study_section_started = True

            if study_section_started and "Test Section" in text and not test_section_started:
                # Check it's the Test Section header, not a reference
                if re.search(r"^Test Section\s*$", text, re.MULTILINE):
                    test_section_started = True

            if study_section_started and not test_section_started:
                full_text += text + "\n"

            if i % 100 == 0:
                print(f"    Page {i}/{total_pages}...")

    print(f"  Study Section text length: {len(full_text):,} chars")

    return _parse_exam_prep_questions(full_text)


def _parse_exam_prep_questions(text: str) -> list[dict]:
    """
    Parse Q+A+Explanation format from the large exam prep PDF.

    Pattern per question:
      NUMBER. QUESTION_TEXT:

      A. option_a
      B. option_b
      C. option_c
      D. option_d

      Answer: X. Explanation...
    """
    questions = []

    # Split the text into individual question blocks
    # Questions start with a number followed by a period
    block_pattern = re.compile(
        r"(?:^|\n)(\d{1,3})\.\s+(.*?)(?=\n\d{1,3}\.\s|\Z)",
        re.DOTALL,
    )

    current_topic = "Vocabulary"

    # Detect topic changes
    topic_headers = {t.lower(): TOPIC_MAP[t] for t in EXAM_PREP_TOPICS}

    for match in block_pattern.finditer(text):
        num = int(match.group(1))
        block = match.group(2).strip()

        # Check if any topic header appears in preceding text (rough heuristic)
        for header_lower, topic_short in topic_headers.items():
            if header_lower in block[:100].lower():
                current_topic = topic_short
                break

        # Extract options A/B/C/D
        options: dict[str, str] = {}
        option_pat = re.compile(
            r"\n([A-D])\.\s+(.+?)(?=\n[A-D]\.\s|\nAnswer:|\Z)",
            re.DOTALL,
        )

        first_opt = option_pat.search(block)
        if first_opt:
            question_body = block[:first_opt.start()].strip()
        else:
            question_body = block.strip()

        for opt_m in option_pat.finditer(block):
            letter = opt_m.group(1).upper()
            option_text = re.sub(r"\s+", " ", opt_m.group(2).strip())
            options[letter] = option_text

        # Extract answer and explanation
        correct_answer = None
        explanation = None
        answer_pat = re.compile(r"Answer:\s*([A-D])\.\s*(.*?)$", re.DOTALL | re.IGNORECASE)
        ans_m = answer_pat.search(block)
        if ans_m:
            correct_answer = ans_m.group(1).upper()
            explanation = re.sub(r"\s+", " ", ans_m.group(2).strip())

        question_body = re.sub(r"\s+", " ", question_body.replace("\n", " ")).strip()
        # Remove trailing colon from question
        question_body = question_body.rstrip(":")

        if question_body and len(options) >= 2 and correct_answer:
            questions.append({
                "number": num,
                "question_text": question_body,
                "options": options,
                "correct_answer": correct_answer,
                "explanation": explanation,
                "topic": current_topic,
            })

    return questions


# ---------------------------------------------------------------------------
# Topic Detection for the large PDF
# ---------------------------------------------------------------------------

def detect_topic_from_section(pdf_path: Path) -> dict[int, str]:
    """
    Scan the PDF and build a map of page_number -> topic based on section headers.
    Used to assign topics to questions in the large PDF.
    """
    page_topics: dict[int, str] = {}
    current_topic = "Vocabulary"

    with pdfplumber.open(str(pdf_path)) as pdf:
        for i, page in enumerate(pdf.pages):
            text = (page.extract_text() or "").strip()
            first_line = text.split("\n")[0].strip() if text else ""

            for section_name in EXAM_PREP_TOPICS:
                if section_name.lower() in first_line.lower() or first_line == section_name:
                    current_topic = TOPIC_MAP[section_name]
                    break

            page_topics[i] = current_topic

    return page_topics


# ---------------------------------------------------------------------------
# Database Seeding
# ---------------------------------------------------------------------------

def seed_database(db: Session):
    print("Creating tables if needed...")
    Base.metadata.create_all(bind=engine)

    # Create California Real Estate course
    course = db.query(Course).filter(Course.name == "California Real Estate License Exam").first()
    if not course:
        course = Course(
            id=str(uuid.uuid4()),
            name="California Real Estate License Exam",
            description=(
                "Comprehensive preparation for the California Department of Real Estate "
                "Salesperson License Exam. Covers all key topics: Agency, Contracts, "
                "Finance, Property Ownership, Valuation, Transfer, and Practice."
            ),
            state="CA",
            passing_score=70.0,
        )
        db.add(course)
        db.commit()
        print(f"Created course: {course.name} (id={course.id})")
    else:
        print(f"Course already exists: {course.name}")

    total_inserted = 0

    # -----------------------------------------------------------------------
    # Ingest Revei booklets
    # -----------------------------------------------------------------------
    for source_info in REVEI_SOURCES:
        path = source_info["path"]
        if not path.exists():
            print(f"  WARNING: File not found: {path}")
            continue

        print(f"\nParsing {path.name}...")
        questions_data, answer_key = parse_revei_booklet(path)
        print(f"  Found {len(questions_data)} questions, {len(answer_key)} answers in key")

        inserted = 0
        for qd in questions_data:
            num = qd["number"]
            opts = qd["options"]
            correct_raw = answer_key.get(num)
            correct_answer = correct_raw.upper() if correct_raw else None

            # Map a->A, b->B...
            option_map = {"a": "A", "b": "B", "c": "C", "d": "D"}
            if correct_answer and correct_answer.lower() in option_map:
                correct_answer = option_map[correct_answer.lower()]

            topic = classify_topic(qd["question_text"], source_info["topic"])

            q = Question(
                id=str(uuid.uuid4()),
                course_id=course.id,
                question_text=qd["question_text"],
                option_a=opts.get("a"),
                option_b=opts.get("b"),
                option_c=opts.get("c"),
                option_d=opts.get("d"),
                correct_answer=correct_answer,
                explanation=None,
                topic=topic,
                difficulty="medium",
                source=source_info["source_name"],
            )
            db.add(q)
            inserted += 1

        db.commit()
        print(f"  Inserted {inserted} questions from {path.name}")
        total_inserted += inserted

    # -----------------------------------------------------------------------
    # Ingest large exam prep PDF
    # -----------------------------------------------------------------------
    if not EXAM_PREP_PDF.exists():
        print(f"\nWARNING: Large PDF not found: {EXAM_PREP_PDF}")
    else:
        print(f"\nParsing {EXAM_PREP_PDF.name} (Study Section)...")
        exam_questions = parse_exam_prep_pdf(EXAM_PREP_PDF)
        print(f"  Found {len(exam_questions)} questions with answers+explanations")

        inserted = 0
        for qd in exam_questions:
            opts = qd.get("options", {})
            q = Question(
                id=str(uuid.uuid4()),
                course_id=course.id,
                question_text=qd["question_text"],
                option_a=opts.get("A"),
                option_b=opts.get("B"),
                option_c=opts.get("C"),
                option_d=opts.get("D"),
                correct_answer=qd.get("correct_answer"),
                explanation=qd.get("explanation"),
                topic=qd.get("topic"),
                difficulty="medium",
                source="2021 CA Real Estate Exam Prep",
            )
            db.add(q)
            inserted += 1

            if inserted % 100 == 0:
                db.commit()
                print(f"    Committed {inserted} questions...")

        db.commit()
        print(f"  Inserted {inserted} questions from large PDF")
        total_inserted += inserted

    print(f"\n{'='*50}")
    print(f"DONE. Total questions inserted: {total_inserted}")
    print(f"Course ID: {course.id}")
    print(f"{'='*50}")


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
