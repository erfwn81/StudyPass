#!/usr/bin/env python3
"""
GPU-powered Explanation Generator
===================================
Uses Ollama (local LLM on your RTX 4070) to generate explanations
for questions that currently have no explanation (the 3 Revei booklets).

Requirements:
  - Ollama running: `ollama serve`
  - Model pulled: `ollama pull llama3.2` or `ollama pull mistral`

Usage:
  python scripts/generate_explanations.py
  python scripts/generate_explanations.py --model mistral --batch 20
  python scripts/generate_explanations.py --dry-run  # preview without saving
"""

import sys
import time
import json
import argparse
import httpx
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from sqlalchemy import select, update
from app.db import SessionLocal
from app.models.question import Question

OLLAMA_URL = "http://localhost:11434"
DEFAULT_MODEL = "llama3.2"

PROMPT_TEMPLATE = """You are a California Real Estate exam tutor. Given this multiple choice question and its correct answer, write a concise explanation (2-4 sentences) of WHY that answer is correct and why the others are wrong.

Question: {question}

A. {option_a}
B. {option_b}
C. {option_c}
D. {option_d}

Correct Answer: {correct_answer}. {correct_text}

Write only the explanation. No preamble, no "The correct answer is...", just the explanation starting directly with the reasoning."""


def check_ollama(model: str) -> bool:
    """Check if Ollama is running and the model is available."""
    try:
        r = httpx.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if r.status_code != 200:
            return False
        tags = r.json()
        available = [m["name"].split(":")[0] for m in tags.get("models", [])]
        model_base = model.split(":")[0]
        if model_base not in available:
            print(f"Model '{model}' not found. Available: {available}")
            print(f"Run: ollama pull {model}")
            return False
        return True
    except Exception as e:
        print(f"Ollama not reachable at {OLLAMA_URL}: {e}")
        print("Start Ollama with: ollama serve")
        return False


def get_option_text(question: Question, letter: str) -> str:
    map_ = {"A": question.option_a, "B": question.option_b,
            "C": question.option_c, "D": question.option_d}
    return map_.get(letter, "") or ""


def generate_explanation(question: Question, model: str, timeout: int = 60) -> str | None:
    """Call Ollama to generate an explanation for a question."""
    if not question.correct_answer:
        return None

    correct_text = get_option_text(question, question.correct_answer)

    prompt = PROMPT_TEMPLATE.format(
        question=question.question_text,
        option_a=question.option_a or "",
        option_b=question.option_b or "",
        option_c=question.option_c or "",
        option_d=question.option_d or "",
        correct_answer=question.correct_answer,
        correct_text=correct_text,
    )

    try:
        response = httpx.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.3,
                    "top_p": 0.9,
                    "num_predict": 200,
                },
            },
            timeout=timeout,
        )
        if response.status_code == 200:
            data = response.json()
            text = data.get("response", "").strip()
            return text if text else None
        else:
            print(f"  Ollama error {response.status_code}: {response.text[:100]}")
            return None
    except Exception as e:
        print(f"  Request failed: {e}")
        return None


def main():
    parser = argparse.ArgumentParser(description="Generate explanations using local LLM")
    parser.add_argument("--model", default=DEFAULT_MODEL, help="Ollama model name")
    parser.add_argument("--batch", type=int, default=50, help="Questions per batch commit")
    parser.add_argument("--limit", type=int, default=0, help="Max questions to process (0=all)")
    parser.add_argument("--topic", help="Only process a specific topic")
    parser.add_argument("--dry-run", action="store_true", help="Preview without saving to DB")
    parser.add_argument("--timeout", type=int, default=60, help="Per-question timeout (seconds)")
    args = parser.parse_args()

    print(f"StudyPass Explanation Generator")
    print(f"  Model: {args.model}")
    print(f"  Ollama: {OLLAMA_URL}")
    print(f"  Dry run: {args.dry_run}")
    print()

    if not args.dry_run and not check_ollama(args.model):
        sys.exit(1)

    db = SessionLocal()
    try:
        # Find questions without explanations that have correct answers
        q = db.query(Question).filter(
            Question.explanation.is_(None),
            Question.correct_answer.isnot(None),
        )
        if args.topic:
            q = q.filter(Question.topic == args.topic)

        questions = q.all()
        total = len(questions)

        if args.limit > 0:
            questions = questions[:args.limit]

        print(f"Found {total} questions without explanations")
        print(f"Processing: {len(questions)} questions\n")

        if not questions:
            print("Nothing to do!")
            return

        success = 0
        failed = 0
        start_time = time.time()

        for i, question in enumerate(questions, 1):
            topic_label = question.topic or "General"
            print(f"[{i}/{len(questions)}] {topic_label} — {question.question_text[:60]}...")

            if args.dry_run:
                print("  [DRY RUN] Would generate explanation")
                continue

            explanation = generate_explanation(question, args.model, args.timeout)

            if explanation:
                question.explanation = explanation
                success += 1
                print(f"  ✓ {explanation[:80]}...")
            else:
                failed += 1
                print(f"  ✗ Failed to generate")

            # Batch commit
            if i % args.batch == 0:
                db.commit()
                elapsed = time.time() - start_time
                rate = i / elapsed
                remaining = (len(questions) - i) / rate if rate > 0 else 0
                print(f"\n  --- Committed batch {i//args.batch} | "
                      f"{i} done | ETA: {remaining/60:.1f} min ---\n")

        if not args.dry_run:
            db.commit()
            elapsed = time.time() - start_time
            print(f"\n{'='*50}")
            print(f"DONE in {elapsed/60:.1f} minutes")
            print(f"  Success: {success}")
            print(f"  Failed:  {failed}")
            print(f"  Rate:    {success/elapsed*60:.1f} questions/min")
            print(f"{'='*50}")

    finally:
        db.close()


if __name__ == "__main__":
    main()
