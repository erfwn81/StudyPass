"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { BookOpen, LogOut, User, ClipboardList, Home } from "lucide-react";

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard", icon: <Home size={15} /> },
  { href: "/study", label: "Study Guide", icon: <BookOpen size={15} /> },
  { href: "/practice-tests", label: "Practice Tests", icon: <ClipboardList size={15} /> },
];

export default function NavBar() {
  const { token, clearToken } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow">
            <BookOpen size={15} className="text-white" />
          </div>
          <span className="font-bold text-base bg-gradient-to-r from-blue-700 to-indigo-700 bg-clip-text text-transparent">
            StudyPass
          </span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${
                  active
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {link.icon}
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Auth */}
        <div className="flex items-center gap-2 shrink-0">
          {token ? (
            <>
              <div className="hidden sm:flex items-center gap-2 text-sm text-slate-500 border-r border-slate-200 pr-3 mr-1">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white text-xs font-bold">
                  {token.name ? token.name[0].toUpperCase() : token.email[0].toUpperCase()}
                </div>
                <span className="font-medium text-slate-700 max-w-[120px] truncate">
                  {token.name || token.email}
                </span>
              </div>
              <button
                onClick={() => { clearToken(); router.push("/auth/login"); }}
                className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
              >
                <LogOut size={15} />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : (
            <Link href="/auth/login" className="btn-primary text-sm py-2 px-4">
              <User size={14} />
              Sign In
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
