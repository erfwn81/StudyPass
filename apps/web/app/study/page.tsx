"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useState } from "react";
import { api } from "@studypass/core/api/client";
import { ChevronDown, ChevronUp } from "lucide-react";
import NavBar from "@/components/NavBar";

const SECTIONS = [
  { key: "Revei Finance Booklet", label: "Finance", color: "blue" },
  { key: "Revei Practice Booklet", label: "Practice", color: "green" },
  { key: "Revei Principles Booklet", label: "Principles", color: "purple" },
];

function QuestionCard({ q, idx }: { q: any; idx: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="card">
      <button
        className="w-full text-left flex items-start justify-between gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex gap-3">
          <span className="text-sm font-medium text-slate-400 mt-0.5 min-w-[2rem]">
            {idx + 1}.
          </span>
          <span className="text-slate-800 font-medium">{q.question_text}</span>
        </div>
        {expanded ? (
          <ChevronUp size={18} className="text-slate-400 mt-0.5 shrink-0" />
        ) : (
          <ChevronDown size={18} className="text-slate-400 mt-0.5 shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="mt-4 pl-9 space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {(["A", "B", "C", "D"] as const).map((letter) => {
              const optKey = `option_${letter.toLowerCase()}` as keyof typeof q;
              const optText = q[optKey] as string | undefined;
              if (!optText) return null;
              const isCorrect = q.correct_answer === letter;
              return (
                <div
                  key={letter}
                  className={`flex gap-2 p-2.5 rounded-lg text-sm ${
                    isCorrect
                      ? "bg-green-50 text-green-800 border border-green-200"
                      : "bg-slate-50 text-slate-700"
                  }`}
                >
                  <span className="font-semibold min-w-[1.5rem]">{letter}.</span>
                  <span>{optText}</span>
                </div>
              );
            })}
          </div>
          {q.explanation && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
              <span className="font-semibold">Explanation: </span>
              {q.explanation}
            </div>
          )}
          {q.topic && (
            <span className="text-xs bg-slate-100 text-slate-500 px-2 py-1 rounded-full">
              {q.topic}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

function SectionContent({
  courseId,
  source,
}: {
  courseId: string;
  source: string;
}) {
  const [page, setPage] = useState(0);
  const [topicFilter, setTopicFilter] = useState<string | undefined>();
  const PAGE_SIZE = 100;

  const { data, isLoading } = useQuery({
    queryKey: ["questions", courseId, source, topicFilter, page],
    queryFn: () =>
      api.getQuestions({
        course_id: courseId,
        source,
        topic: topicFilter,
        limit: PAGE_SIZE,
        offset: page * PAGE_SIZE,
      }),
    enabled: !!courseId,
  });

  // Get all topics for this source for the filter pills
  const { data: allData } = useQuery({
    queryKey: ["questions-all", courseId, source],
    queryFn: () =>
      api.getQuestions({ course_id: courseId, source, limit: 500 }),
    enabled: !!courseId,
  });

  const topics = allData
    ? [...new Set(allData.questions.map((q) => q.topic).filter(Boolean))]
    : [];

  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="space-y-4">
      {/* Topic filter */}
      {topics.length > 1 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setTopicFilter(undefined); setPage(0); }}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              !topicFilter
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
            }`}
          >
            All Topics
          </button>
          {topics.map((t) => (
            <button
              key={t}
              onClick={() => { setTopicFilter(t!); setPage(0); }}
              className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                topicFilter === t
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-slate-600 border-slate-200 hover:border-blue-300"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      )}

      {/* Count */}
      <p className="text-sm text-slate-500">
        {isLoading ? "Loading..." : `${total} questions`}
        {totalPages > 1 && ` — page ${page + 1} of ${totalPages}`}
      </p>

      {/* Questions */}
      <div className="space-y-3">
        {data?.questions.map((q, idx) => (
          <QuestionCard key={q.id} q={q} idx={page * PAGE_SIZE + idx} />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex gap-2 justify-center pt-4">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm text-slate-500 py-2 px-3">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page === totalPages - 1}
            className="btn-secondary text-sm disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

function StudyContent() {
  const params = useSearchParams();
  const courseIdParam = params.get("course_id");
  const sectionParam = params.get("section") ?? SECTIONS[0].key;
  const [activeSection, setActiveSection] = useState(sectionParam);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
    enabled: !courseIdParam || courseIdParam === "undefined",
  });

  const courseId =
    courseIdParam && courseIdParam !== "undefined"
      ? courseIdParam
      : courses?.courses[0]?.id ?? "";

  return (
    <div className="min-h-screen bg-slate-50">
      <NavBar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Study Guide</h1>
          <p className="text-slate-500 mt-1">
            Browse all questions organized by booklet
          </p>
        </div>

        {/* Section tabs */}
        <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-0">
          {SECTIONS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActiveSection(s.key)}
              className={`px-5 py-2.5 text-sm font-medium rounded-t-lg border-b-2 transition-colors ${
                activeSection === s.key
                  ? "border-blue-600 text-blue-700 bg-white"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-100"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Section content */}
        {courseId && (
          <SectionContent key={activeSection} courseId={courseId} source={activeSection} />
        )}
      </div>
    </div>
  );
}

export default function StudyPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400">Loading...</div>}>
      <StudyContent />
    </Suspense>
  );
}
