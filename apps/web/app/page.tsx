import Link from "next/link";
import { BookOpen, BarChart2, Zap, Shield, Brain, Trophy } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-grid relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-300/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Nav */}
        <nav className="flex items-center justify-between mb-20">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
              StudyPass
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth/login" className="btn-secondary text-sm py-2 px-4">
              Sign In
            </Link>
            <Link href="/auth/register" className="btn-primary text-sm py-2 px-4">
              Get Started
            </Link>
          </div>
        </nav>

        {/* Hero */}
        <div className="text-center space-y-6 mb-20 animate-fade-in-up">
          <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm font-medium px-4 py-2 rounded-full">
            <Zap size={14} className="fill-blue-500" />
            AI-powered exam prep with GPU acceleration
          </div>

          <h1 className="text-6xl sm:text-7xl font-extrabold leading-tight">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Pass Your CA
            </span>
            <br />
            <span className="text-slate-800">Real Estate Exam</span>
          </h1>

          <p className="text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            600+ real exam questions from Finance, Practice, and Principles booklets.
            AI explanations, progress tracking, and timed practice tests.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link href="/dashboard" className="btn-primary text-base py-3.5 px-8 animate-pulse-glow">
              Start Studying Free
            </Link>
            <Link href="/practice-tests" className="btn-secondary text-base py-3.5 px-8">
              Browse Practice Tests
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6 mb-20">
          {[
            { value: "600+", label: "Real Questions", color: "from-blue-500 to-blue-600" },
            { value: "3", label: "Official Booklets", color: "from-indigo-500 to-purple-600" },
            { value: "70%", label: "Passing Score", color: "from-green-500 to-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="card text-center hover:-translate-y-1 transition-transform duration-200">
              <div className={`text-4xl font-black bg-gradient-to-br ${s.color} bg-clip-text text-transparent`}>
                {s.value}
              </div>
              <div className="text-sm text-slate-500 font-medium mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Features */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {[
            {
              icon: <BookOpen size={22} />,
              title: "3 Official Booklets",
              desc: "Finance, Practice, and Principles — all 600 questions with answer keys.",
              color: "text-blue-600 bg-blue-50",
            },
            {
              icon: <Brain size={22} />,
              title: "AI Tutor Chat",
              desc: "Ask anything about real estate. Powered by llama3.2 running locally on your GPU.",
              color: "text-purple-600 bg-purple-50",
            },
            {
              icon: <Trophy size={22} />,
              title: "Practice Exams",
              desc: "Finance, Practice, and Principles exams + mixed full 150-question simulations.",
              color: "text-amber-600 bg-amber-50",
            },
            {
              icon: <BarChart2 size={22} />,
              title: "Progress Tracking",
              desc: "Track scores, weak topics, and streaks across all your exam sessions.",
              color: "text-green-600 bg-green-50",
            },
            {
              icon: <Zap size={22} />,
              title: "GPU Accelerated",
              desc: "AI explanations generated locally using your RTX 4070 — blazing fast, no API costs.",
              color: "text-orange-600 bg-orange-50",
            },
            {
              icon: <Shield size={22} />,
              title: "California DRE Aligned",
              desc: "Content mapped to DRE exam topics. Pass rate goal: 70%.",
              color: "text-red-600 bg-red-50",
            },
          ].map((f) => (
            <div key={f.title} className="card group hover:-translate-y-1 hover:shadow-2xl transition-all duration-200">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                {f.icon}
              </div>
              <h3 className="font-bold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="card-glass text-center py-14 px-8 bg-gradient-to-br from-blue-600/90 to-indigo-700/90 text-white border-0">
          <h2 className="text-3xl font-bold mb-3">Ready to pass on your first try?</h2>
          <p className="text-blue-100 mb-8 text-lg">
            Join today and start with a free practice exam.
          </p>
          <Link href="/auth/register" className="inline-flex items-center gap-2 bg-white text-blue-700 font-bold py-3.5 px-10 rounded-xl hover:bg-blue-50 transition-colors shadow-xl text-base">
            Create Free Account
          </Link>
        </div>

        <p className="text-center text-slate-400 text-sm mt-10">
          StudyPass — California Real Estate License Exam Prep
        </p>
      </div>
    </main>
  );
}
