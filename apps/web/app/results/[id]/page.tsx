"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@studypass/core/api/client";
import Link from "next/link";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { CheckCircle, XCircle, Flag, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import NavBar from "@/components/NavBar";
import type { ExamAnswerResult } from "@studypass/core/types";

export default function ResultsPage({ params }: { params: { id: string } }) {
  const [expandedQ, setExpandedQ] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  const { data: result, isLoading } = useQuery({
    queryKey: ["results", params.id],
    queryFn: () => api.getExamResults(params.id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400">
        Loading results...
      </div>
    );
  }

  if (!result) return null;

  const displayedAnswers = showAll ? result.answers : result.answers.slice(0, 20);

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Score card */}
        <div className={`card text-center space-y-2 border-2 ${result.passed ? "border-green-400" : "border-red-300"}`}>
          <div className={`text-6xl font-bold ${result.passed ? "text-green-600" : "text-red-500"}`}>
            {result.percentage.toFixed(1)}%
          </div>
          <div className="text-slate-500 text-lg">
            {result.score} / {result.total} correct
          </div>
          <div
            className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${
              result.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {result.passed ? "PASSED" : "NOT PASSED"}
          </div>
          <p className="text-slate-400 text-xs">Passing score: {result.passing_score}%</p>
        </div>

        {/* Topic breakdown chart */}
        {result.topic_breakdown.length > 0 && (
          <div className="card">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Performance by Topic</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={result.topic_breakdown} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="topic" width={140} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="percentage" radius={[0, 4, 4, 0]}>
                  {result.topic_breakdown.map((entry, i) => (
                    <Cell key={i} fill={entry.percentage >= 70 ? "#22c55e" : entry.percentage >= 50 ? "#f59e0b" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Link href="/dashboard" className="btn-secondary flex-1 text-center">
            Dashboard
          </Link>
          <Link href="/dashboard" className="btn-primary flex-1 text-center">
            Start New Exam
          </Link>
        </div>

        {/* Answer review */}
        <div className="card">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">
            Answer Review ({result.answers.length} questions)
          </h2>

          <div className="space-y-3">
            {displayedAnswers.map((ar, idx) => (
              <AnswerReviewItem
                key={ar.question.id}
                idx={idx}
                answerResult={ar}
                expanded={expandedQ === ar.question.id}
                onToggle={() => setExpandedQ(expandedQ === ar.question.id ? null : ar.question.id)}
              />
            ))}
          </div>

          {result.answers.length > 20 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-4 w-full btn-secondary text-sm"
            >
              {showAll ? "Show Less" : `Show All ${result.answers.length} Questions`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function AnswerReviewItem({
  idx,
  answerResult,
  expanded,
  onToggle,
}: {
  idx: number;
  answerResult: ExamAnswerResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { question, user_answer, is_correct, flagged } = answerResult;

  const options: Array<{ letter: "A" | "B" | "C" | "D"; text?: string }> = [
    { letter: "A", text: question.option_a ?? undefined },
    { letter: "B", text: question.option_b ?? undefined },
    { letter: "C", text: question.option_c ?? undefined },
    { letter: "D", text: question.option_d ?? undefined },
  ].filter((o) => o.text);

  return (
    <div className={`border rounded-lg overflow-hidden ${is_correct ? "border-green-200" : "border-red-200"}`}>
      <button
        className="w-full text-left flex items-start gap-3 p-4 hover:bg-slate-50 transition-colors"
        onClick={onToggle}
      >
        <span className="text-sm text-slate-400 mt-0.5 min-w-[1.75rem]">{idx + 1}.</span>
        {is_correct ? (
          <CheckCircle size={18} className="text-green-500 shrink-0 mt-0.5" />
        ) : (
          <XCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
        )}
        {flagged && <Flag size={16} className="text-amber-500 shrink-0 mt-0.5" />}
        <span className="flex-1 text-sm text-slate-700">{question.question_text}</span>
        {expanded ? (
          <ChevronUp size={16} className="text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown size={16} className="text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-2 bg-slate-50">
          {options.map((opt) => {
            const isUserAnswer = user_answer === opt.letter;
            const isCorrectAnswer = question.correct_answer === opt.letter;
            return (
              <div
                key={opt.letter}
                className={`flex gap-2 p-2.5 rounded-lg text-sm ${
                  isCorrectAnswer
                    ? "bg-green-100 text-green-800 border border-green-200"
                    : isUserAnswer && !isCorrectAnswer
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-white text-slate-600 border border-slate-100"
                }`}
              >
                <span className="font-semibold min-w-[1.5rem]">{opt.letter}.</span>
                <span className="flex-1">{opt.text}</span>
                {isCorrectAnswer && (
                  <span className="text-green-600 text-xs font-medium ml-auto shrink-0">Correct</span>
                )}
                {isUserAnswer && !isCorrectAnswer && (
                  <span className="text-red-600 text-xs font-medium ml-auto shrink-0">Your answer</span>
                )}
              </div>
            );
          })}
          {question.explanation && (
            <div className="mt-2 p-3 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800">
              <span className="font-semibold">Explanation: </span>
              {question.explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
