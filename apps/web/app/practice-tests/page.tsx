"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@studypass/core/api/client";
import NavBar from "@/components/NavBar";
import { PlayCircle, BookOpen, Layers } from "lucide-react";

const PRACTICE_TESTS = [
  {
    id: "finance-1",
    title: "Finance Exam 1",
    description: "150 questions focused on Real Estate Finance — loans, mortgages, interest, appraisal.",
    source: "Revei Finance Booklet",
    count: 150,
    mode: "full",
    icon: "💰",
    color: "blue",
  },
  {
    id: "finance-2",
    title: "Finance Exam 2",
    description: "Another 150-question randomized draw from the Finance booklet.",
    source: "Revei Finance Booklet",
    count: 150,
    mode: "full",
    icon: "💰",
    color: "blue",
  },
  {
    id: "practice-1",
    title: "Practice Exam 1",
    description: "150 questions on Real Estate Practice — listings, agency, disclosures, fair housing.",
    source: "Revei Practice Booklet",
    count: 150,
    mode: "full",
    icon: "📋",
    color: "green",
  },
  {
    id: "practice-2",
    title: "Practice Exam 2",
    description: "Another 150-question randomized draw from the Practice booklet.",
    source: "Revei Practice Booklet",
    count: 150,
    mode: "full",
    icon: "📋",
    color: "green",
  },
  {
    id: "principles-1",
    title: "Principles Exam 1",
    description: "150 questions on Real Estate Principles — ownership, title, deeds, zoning.",
    source: "Revei Principles Booklet",
    count: 150,
    mode: "full",
    icon: "🏡",
    color: "purple",
  },
  {
    id: "principles-2",
    title: "Principles Exam 2",
    description: "Another 150-question randomized draw from the Principles booklet.",
    source: "Revei Principles Booklet",
    count: 150,
    mode: "full",
    icon: "🏡",
    color: "purple",
  },
  {
    id: "mixed-1",
    title: "Full Mixed Exam 1",
    description: "150 questions drawn randomly across all three booklets — simulates the real exam.",
    source: undefined,
    count: 150,
    mode: "full",
    icon: "🎯",
    color: "red",
  },
  {
    id: "mixed-2",
    title: "Full Mixed Exam 2",
    description: "Another 150-question mixed simulation from all sources.",
    source: undefined,
    count: 150,
    mode: "full",
    icon: "🎯",
    color: "red",
  },
  {
    id: "mixed-3",
    title: "Full Mixed Exam 3",
    description: "A third 150-question mixed simulation — each attempt is uniquely randomized.",
    source: undefined,
    count: 150,
    mode: "full",
    icon: "🎯",
    color: "red",
  },
  {
    id: "quick-finance",
    title: "Finance Quick Quiz",
    description: "25 random Finance questions — great for a fast review session.",
    source: "Revei Finance Booklet",
    count: 25,
    mode: "quick",
    icon: "⚡",
    color: "blue",
  },
  {
    id: "quick-practice",
    title: "Practice Quick Quiz",
    description: "25 random Practice questions.",
    source: "Revei Practice Booklet",
    count: 25,
    mode: "quick",
    icon: "⚡",
    color: "green",
  },
  {
    id: "quick-principles",
    title: "Principles Quick Quiz",
    description: "25 random Principles questions.",
    source: "Revei Principles Booklet",
    count: 25,
    mode: "quick",
    icon: "⚡",
    color: "purple",
  },
];

const COLOR_CLASSES: Record<string, { border: string; badge: string; btn: string }> = {
  blue: {
    border: "border-blue-200 hover:border-blue-400",
    badge: "bg-blue-50 text-blue-700",
    btn: "bg-blue-600 hover:bg-blue-700 text-white",
  },
  green: {
    border: "border-green-200 hover:border-green-400",
    badge: "bg-green-50 text-green-700",
    btn: "bg-green-600 hover:bg-green-700 text-white",
  },
  purple: {
    border: "border-purple-200 hover:border-purple-400",
    badge: "bg-purple-50 text-purple-700",
    btn: "bg-purple-600 hover:bg-purple-700 text-white",
  },
  red: {
    border: "border-red-200 hover:border-red-400",
    badge: "bg-red-50 text-red-700",
    btn: "bg-red-600 hover:bg-red-700 text-white",
  },
  orange: {
    border: "border-orange-200 hover:border-orange-400",
    badge: "bg-orange-50 text-orange-700",
    btn: "bg-orange-600 hover:bg-orange-700 text-white",
  },
};

export default function PracticeTestsPage() {
  const router = useRouter();
  const [starting, setStarting] = useState<string | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
  });

  const courseId = courses?.courses[0]?.id;

  const handleStart = async (test: typeof PRACTICE_TESTS[0]) => {
    if (!courseId) return;
    setStarting(test.id);
    try {
      const session = await api.startExam({
        course_id: courseId,
        mode: test.mode as any,
        question_count: test.count,
        topic: undefined,
      });
      sessionStorage.setItem(`exam_${session.session_id}`, JSON.stringify(session.questions));
      router.push(`/exam/${session.session_id}?total=${session.total}`);
    } catch (err) {
      console.error(err);
      setStarting(null);
    }
  };

  const groups = [
    { label: "Finance Booklet", color: "blue", tests: PRACTICE_TESTS.filter(t => t.source === "Revei Finance Booklet") },
    { label: "Practice Booklet", color: "green", tests: PRACTICE_TESTS.filter(t => t.source === "Revei Practice Booklet") },
    { label: "Principles Booklet", color: "purple", tests: PRACTICE_TESTS.filter(t => t.source === "Revei Principles Booklet") },
    { label: "Full Mixed Exams", color: "red", tests: PRACTICE_TESTS.filter(t => !t.source || t.id.startsWith("mixed")) },
    { label: "Quick Quizzes", color: "orange", tests: PRACTICE_TESTS.filter(t => t.mode === "quick") },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-10">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Practice Tests</h1>
          <p className="text-slate-500 mt-1">
            Choose an exam to start. Each attempt is freshly randomized from the question pool.
          </p>
        </div>

        {groups.map((group) => (
          <section key={group.label}>
            <h2 className="text-lg font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Layers size={18} />
              {group.label}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {group.tests.map((test) => {
                const colors = COLOR_CLASSES[test.color];
                const isStarting = starting === test.id;
                return (
                  <div
                    key={test.id}
                    className={`bg-white rounded-xl border-2 p-5 flex flex-col gap-3 transition-all ${colors.border}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-2xl">{test.icon}</span>
                      <span className={`text-xs font-medium px-2 py-1 rounded-full ${colors.badge}`}>
                        {test.count}q
                      </span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{test.title}</h3>
                      <p className="text-sm text-slate-500 mt-1">{test.description}</p>
                    </div>
                    <button
                      onClick={() => handleStart(test)}
                      disabled={!courseId || isStarting}
                      className={`mt-auto flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${colors.btn}`}
                    >
                      <PlayCircle size={16} />
                      {isStarting ? "Starting..." : "Start Exam"}
                    </button>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
