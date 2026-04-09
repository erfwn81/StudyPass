"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "@studypass/core/api/client";
import { useAuthStore } from "@/lib/store";
import { formatPercentage } from "@studypass/core/utils";
import { BarChart2, Play, Flame, Trophy, BookOpen, ArrowRight, ClipboardList, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  const { token } = useAuthStore();

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
  });

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: () => api.getProgressSummary(),
    enabled: !!token,
  });

  const { data: history } = useQuery({
    queryKey: ["exam-history"],
    queryFn: () => api.getExamHistory(),
    enabled: !!token,
  });

  const course = courses?.courses[0];
  const lastExam = history?.exams[0];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">
            Welcome back{token?.name ? `, ${token.name.split(" ")[0]}` : ""}! 👋
          </h1>
          <p className="text-slate-500 mt-1">Ready to study? Let&apos;s crush it today.</p>
        </div>
        {course && (
          <Link
            href={`/exam/start?course_id=${course.id}&mode=quick&count=25`}
            className="btn-primary hidden sm:flex"
          >
            <Play size={16} />
            Quick Quiz
          </Link>
        )}
      </div>

      {/* Stats */}
      {progress ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<BarChart2 size={22} className="text-blue-600" />}
            bg="bg-blue-50"
            label="Avg Score"
            value={formatPercentage(progress.average_score)}
            color="text-blue-700"
          />
          <StatCard
            icon={<Play size={22} className="text-green-600" />}
            bg="bg-green-50"
            label="Exams Taken"
            value={String(progress.total_exams)}
            color="text-green-700"
          />
          <StatCard
            icon={<Trophy size={22} className="text-amber-600" />}
            bg="bg-amber-50"
            label="Best Score"
            value={formatPercentage(progress.best_score)}
            color="text-amber-700"
          />
          <StatCard
            icon={<Flame size={22} className="text-orange-600" />}
            bg="bg-orange-50"
            label="Day Streak"
            value={`${progress.streak_days}d`}
            color="text-orange-700"
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card h-24 animate-pulse bg-slate-100/80" />
          ))}
        </div>
      )}

      {/* Quick actions + last exam */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Exam modes */}
        {course && (
          <div className="card space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="section-header mb-0">
                <Play size={18} className="text-blue-600" />
                Start an Exam
              </h2>
              <span className="badge-blue">{course.name.split(" ").slice(0, 2).join(" ")}</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Full Exam", sub: "150 questions", mode: "full", count: 150, color: "from-blue-600 to-indigo-600" },
                { label: "Half Exam", sub: "50 questions", mode: "half", count: 50, color: "from-indigo-500 to-purple-600" },
                { label: "Quick Quiz", sub: "25 questions", mode: "quick", count: 25, color: "from-green-500 to-emerald-600" },
                { label: "Mini Quiz", sub: "10 questions", mode: "mini", count: 10, color: "from-amber-500 to-orange-500" },
              ].map((m) => (
                <Link
                  key={m.mode}
                  href={`/exam/start?course_id=${course.id}&mode=${m.mode}&count=${m.count}`}
                  className={`group relative overflow-hidden bg-gradient-to-br ${m.color} text-white p-4 rounded-xl hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200`}
                >
                  <p className="font-bold text-sm">{m.label}</p>
                  <p className="text-white/70 text-xs mt-0.5">{m.sub}</p>
                  <ArrowRight size={14} className="absolute bottom-3 right-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
            <Link
              href="/practice-tests"
              className="btn-secondary w-full text-sm justify-center"
            >
              <ClipboardList size={15} />
              Browse All Practice Tests
            </Link>
          </div>
        )}

        {/* Study guide card */}
        {course && (
          <div className="card space-y-5">
            <h2 className="section-header mb-0">
              <BookOpen size={18} className="text-indigo-600" />
              Study Guide
            </h2>
            <p className="text-slate-500 text-sm -mt-2">Browse questions by booklet and topic.</p>

            <div className="space-y-2">
              {[
                { label: "Finance Booklet", sub: "Loans, mortgages, interest, appraisal", color: "bg-blue-500", href: "/study?section=Revei Finance Booklet" },
                { label: "Practice Booklet", sub: "Agency, listings, disclosures, fair housing", color: "bg-green-500", href: "/study?section=Revei Practice Booklet" },
                { label: "Principles Booklet", sub: "Ownership, title, deeds, zoning", color: "bg-purple-500", href: "/study?section=Revei Principles Booklet" },
              ].map((b) => (
                <Link
                  key={b.label}
                  href={b.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${b.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800">{b.label}</p>
                    <p className="text-xs text-slate-400 truncate">{b.sub}</p>
                  </div>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors shrink-0" />
                </Link>
              ))}
            </div>

            <Link href="/study" className="btn-secondary w-full text-sm justify-center">
              <BookOpen size={15} />
              Open Study Guide
            </Link>
          </div>
        )}
      </div>

      {/* Last exam + weak topics */}
      <div className="grid lg:grid-cols-2 gap-6">
        {lastExam && (
          <div className="card space-y-4">
            <h2 className="section-header mb-0">
              <TrendingUp size={18} className="text-slate-600" />
              Last Exam
            </h2>
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-end gap-2">
                  <span className={`text-4xl font-black ${lastExam.passed ? "text-green-600" : "text-red-500"}`}>
                    {lastExam.percentage?.toFixed(1)}%
                  </span>
                  <span className={`text-sm font-bold mb-1 px-2 py-0.5 rounded-full ${lastExam.passed ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {lastExam.passed ? "PASSED" : "FAILED"}
                  </span>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {lastExam.score}/{lastExam.total_q} correct · {lastExam.mode} mode
                </p>
                <p className="text-slate-400 text-xs">
                  {new Date(lastExam.started_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
              <Link href={`/results/${lastExam.session_id}`} className="btn-secondary text-sm">
                Review →
              </Link>
            </div>

            {/* Score bar */}
            <div className="w-full bg-slate-100 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${lastExam.passed ? "bg-gradient-to-r from-green-400 to-emerald-500" : "bg-gradient-to-r from-red-400 to-rose-500"}`}
                style={{ width: `${lastExam.percentage ?? 0}%` }}
              />
            </div>
            <p className="text-xs text-slate-400">Passing score: 70%</p>
          </div>
        )}

        {progress && progress.weak_topics.length > 0 && (
          <div className="card space-y-4">
            <h2 className="section-header mb-0">
              <Flame size={18} className="text-orange-500" />
              Weak Topics
            </h2>
            <div className="space-y-3">
              {progress.weak_topics.slice(0, 5).map((t) => (
                <div key={t.topic}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-slate-700 font-medium">{t.topic}</span>
                    <span className={`font-bold text-xs ${t.percentage < 60 ? "text-red-500" : t.percentage < 75 ? "text-amber-500" : "text-green-600"}`}>
                      {t.percentage.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${t.percentage < 60 ? "bg-gradient-to-r from-red-400 to-rose-500" : t.percentage < 75 ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gradient-to-r from-green-400 to-emerald-500"}`}
                      style={{ width: `${t.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value, color }: {
  icon: React.ReactNode;
  bg: string;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="card flex items-center gap-4 hover:-translate-y-0.5 hover:shadow-xl transition-all duration-200">
      <div className={`p-2.5 rounded-xl ${bg} shrink-0`}>{icon}</div>
      <div>
        <div className={`text-2xl font-black ${color}`}>{value}</div>
        <div className="text-xs text-slate-500 font-medium">{label}</div>
      </div>
    </div>
  );
}
