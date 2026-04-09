"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { api } from "@studypass/core/api/client";
import { useExamStore } from "@/lib/store";

function StartExamContent() {
  const params = useSearchParams();
  const router = useRouter();
  const { setSession } = useExamStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const course_id = params.get("course_id") ?? "";
  const mode = (params.get("mode") as any) ?? "quick";
  const count = Number(params.get("count")) || undefined;
  const topic = params.get("topic") ?? undefined;

  const handleStart = async () => {
    setLoading(true);
    setError("");
    try {
      const session = await api.startExam({ course_id, mode, question_count: count, topic });
      sessionStorage.setItem(`exam_${session.session_id}`, JSON.stringify(session.questions));
      setSession(session.session_id);
      router.push(`/exam/${session.session_id}?total=${session.total}`);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to start exam.");
    } finally {
      setLoading(false);
    }
  };

  const modeLabels: Record<string, string> = {
    full: "Full Exam (150 questions)",
    half: "Half Exam (50 questions)",
    quick: "Quick Quiz (25 questions)",
    mini: "Mini Quiz (10 questions)",
    topic: `Topic Quiz${topic ? ` — ${topic}` : ""}`,
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="card max-w-md w-full space-y-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ready to start?</h1>
          <p className="text-slate-500 mt-2">{modeLabels[mode] ?? "Exam"}</p>
          {topic && <p className="text-sm text-blue-600 mt-1">Topic: {topic}</p>}
        </div>

        <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700 text-left space-y-1">
          <p>• Answer all questions before submitting</p>
          <p>• Flag questions to review later</p>
          <p>• Answers are revealed only after submission</p>
          <p>• Passing score: 70%</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 text-sm p-3 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={() => router.back()} className="btn-secondary flex-1">
            Cancel
          </button>
          <button onClick={handleStart} disabled={loading} className="btn-primary flex-1">
            {loading ? "Starting..." : "Start Exam"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StartExamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <StartExamContent />
    </Suspense>
  );
}
