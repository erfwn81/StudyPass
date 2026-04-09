"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { api } from "@studypass/core/api/client";
import { useExamStore } from "@/lib/store";
import type { Question } from "@studypass/core/types";
import { Flag, ChevronLeft, ChevronRight, Home, Clock, AlertTriangle } from "lucide-react";

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function ExamPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  const sessionId = params.id;

  const { answers, flagged, currentIndex, setAnswer, toggleFlag, setCurrentIndex, reset } =
    useExamStore();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [showHomeConfirm, setShowHomeConfirm] = useState(false);

  // Timer
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  useEffect(() => {
    const stored = sessionStorage.getItem(`exam_${sessionId}`);
    if (stored) setQuestions(JSON.parse(stored));
  }, [sessionId]);

  const currentQ = questions[currentIndex];
  const totalQ = questions.length;
  const answeredCount = Object.keys(answers).length;
  const isFlagged = currentQ ? flagged.has(currentQ.id) : false;
  const selectedAnswer = currentQ ? answers[currentQ.id]?.answer : undefined;

  // Timer color: green → amber → red
  const timerColor =
    elapsed < 60 * 60 ? "text-green-600" :
    elapsed < 90 * 60 ? "text-amber-500" :
    "text-red-500";

  const handleSubmit = async () => {
    if (!confirmSubmit) { setConfirmSubmit(true); return; }
    setSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    try {
      const answerList = questions.map((q) => ({
        question_id: q.id,
        answer: answers[q.id]?.answer ?? null,
        flagged: flagged.has(q.id),
      }));
      await api.submitExam(sessionId, { answers: answerList });
      reset();
      router.push(`/results/${sessionId}`);
    } catch (err) {
      console.error(err);
      setSubmitting(false);
    }
  };

  if (!currentQ) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading exam...
      </div>
    );
  }

  const options: Array<{ letter: "A" | "B" | "C" | "D"; text?: string }> = (
    [
      { letter: "A" as const, text: currentQ.option_a ?? undefined },
      { letter: "B" as const, text: currentQ.option_b ?? undefined },
      { letter: "C" as const, text: currentQ.option_c ?? undefined },
      { letter: "D" as const, text: currentQ.option_d ?? undefined },
    ] as const
  ).filter((o) => o.text) as Array<{ letter: "A" | "B" | "C" | "D"; text?: string }>;

  return (
    <div className="min-h-screen bg-grid flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          {/* Home button */}
          <button
            onClick={() => setShowHomeConfirm(true)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all shrink-0"
          >
            <Home size={16} />
            <span className="hidden sm:inline">Home</span>
          </button>

          {/* Progress */}
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Question <strong>{currentIndex + 1}</strong> of <strong>{totalQ}</strong></span>
              <span>{answeredCount} answered</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentIndex + 1) / totalQ) * 100}%` }}
              />
            </div>
          </div>

          {/* Timer */}
          <div className={`flex items-center gap-1.5 font-mono font-bold text-sm shrink-0 ${timerColor}`}>
            <Clock size={16} />
            {formatTime(elapsed)}
          </div>
        </div>
      </div>

      {/* Question area */}
      <div className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 space-y-6">
        {/* Question card */}
        <div className="card shadow-xl">
          <div className="flex items-start justify-between gap-4 mb-2">
            <div className="flex items-center gap-2">
              <span className="badge-blue">Q{currentIndex + 1}</span>
              {currentQ.topic && (
                <span className="text-xs text-slate-400">{currentQ.topic}</span>
              )}
            </div>
            <button
              onClick={() => toggleFlag(currentQ.id)}
              className={`p-2 rounded-lg transition-all shrink-0 ${
                isFlagged
                  ? "bg-amber-100 text-amber-600 shadow-sm"
                  : "text-slate-300 hover:text-slate-500 hover:bg-slate-100"
              }`}
              title="Flag for review"
            >
              <Flag size={18} />
            </button>
          </div>

          <p className="text-slate-800 font-semibold text-lg leading-relaxed mt-4">
            {currentQ.question_text}
          </p>

          <div className="mt-6 space-y-3">
            {options.map((opt) => (
              <button
                key={opt.letter}
                onClick={() => setAnswer(currentQ.id, opt.letter)}
                className={`w-full text-left flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-150 ${
                  selectedAnswer === opt.letter
                    ? "border-blue-500 bg-blue-50 text-blue-800 shadow-md shadow-blue-100"
                    : "border-slate-200 bg-white/70 hover:border-blue-300 hover:bg-blue-50/40 text-slate-700"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-colors ${
                    selectedAnswer === opt.letter
                      ? "bg-blue-500 text-white"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {opt.letter}
                </span>
                <span className="text-sm leading-snug">{opt.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="btn-secondary flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft size={18} /> Previous
          </button>

          {currentIndex < totalQ - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="btn-primary flex items-center gap-2"
            >
              Next <ChevronRight size={18} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className={`font-bold py-2.5 px-6 rounded-xl transition-all active:scale-95 ${
                confirmSubmit
                  ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30"
                  : "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30"
              }`}
            >
              {submitting ? "Submitting..." : confirmSubmit ? `Confirm Submit (${answeredCount}/${totalQ})` : "Submit Exam"}
            </button>
          )}
        </div>

        {confirmSubmit && (
          <div className="card border-2 border-amber-200 bg-amber-50/80">
            <div className="flex items-start gap-3">
              <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-800 text-sm font-semibold">Ready to submit?</p>
                <p className="text-amber-700 text-sm mt-1">
                  You answered {answeredCount} of {totalQ} questions.
                  {answeredCount < totalQ && ` ${totalQ - answeredCount} unanswered will be marked wrong.`}
                </p>
                <button onClick={() => setConfirmSubmit(false)} className="text-sm text-amber-600 hover:underline mt-2">
                  Go back and review
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Question grid navigator */}
        <div className="card">
          <p className="text-sm font-semibold text-slate-600 mb-3">Question Navigator</p>
          <div className="flex flex-wrap gap-1.5">
            {questions.map((q, i) => (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(i)}
                className={`w-9 h-9 rounded-lg text-xs font-bold transition-all ${
                  i === currentIndex
                    ? "bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md"
                    : flagged.has(q.id)
                    ? "bg-amber-100 text-amber-700 border border-amber-300"
                    : answers[q.id]?.answer
                    ? "bg-green-100 text-green-700 border border-green-200"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-green-200 inline-block" /> Answered</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-200 inline-block" /> Flagged</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-slate-200 inline-block" /> Unanswered</span>
          </div>
        </div>
      </div>

      {/* Home confirm modal */}
      {showHomeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card max-w-sm w-full shadow-2xl animate-fade-in-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              <div>
                <p className="font-bold text-slate-800">Leave exam?</p>
                <p className="text-sm text-slate-500">Your progress will be lost.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowHomeConfirm(false)}
                className="btn-secondary flex-1 text-sm"
              >
                Keep Going
              </button>
              <button
                onClick={() => { reset(); router.push("/dashboard"); }}
                className="btn-danger flex-1 text-sm"
              >
                Leave Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
