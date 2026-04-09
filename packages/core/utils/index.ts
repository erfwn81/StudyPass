import type { ExamAnswerResult, AnswerLetter } from "../types";

export function formatScore(score: number, total: number): string {
  const pct = total > 0 ? ((score / total) * 100).toFixed(1) : "0.0";
  return `${score}/${total} (${pct}%)`;
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(1)}%`;
}

export function isPassing(percentage: number, passingScore: number = 70): boolean {
  return percentage >= passingScore;
}

export function getOptionText(
  question: { option_a?: string; option_b?: string; option_c?: string; option_d?: string },
  letter: AnswerLetter
): string | undefined {
  const map: Record<AnswerLetter, string | undefined> = {
    A: question.option_a,
    B: question.option_b,
    C: question.option_c,
    D: question.option_d,
  };
  return map[letter];
}

export function getAnswerColor(
  answerResult: ExamAnswerResult,
  letter: AnswerLetter
): "correct" | "incorrect" | "neutral" {
  if (answerResult.user_answer === letter) {
    return answerResult.is_correct ? "correct" : "incorrect";
  }
  if (answerResult.question.correct_answer === letter) {
    return "correct";
  }
  return "neutral";
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function getDifficultyLabel(difficulty: string): string {
  const labels: Record<string, string> = {
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
  };
  return labels[difficulty] ?? "Medium";
}

export const EXAM_MODES = [
  { id: "full", label: "Full Exam", questionCount: 150, duration: 180 },
  { id: "half", label: "Half Exam", questionCount: 50, duration: 60 },
  { id: "quick", label: "Quick Quiz", questionCount: 25, duration: 30 },
  { id: "mini", label: "Mini Quiz", questionCount: 10, duration: 15 },
] as const;
