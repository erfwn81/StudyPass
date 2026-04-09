import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthToken, AnswerSubmit } from "@studypass/core/types";
import { api } from "@studypass/core/api/client";

// ---------------------------------------------------------------------------
// Auth store
// ---------------------------------------------------------------------------
interface AuthState {
  token: AuthToken | null;
  setToken: (t: AuthToken) => void;
  clearToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (t) => {
        api.setToken(t.access_token);
        set({ token: t });
      },
      clearToken: () => {
        api.clearToken();
        set({ token: null });
      },
    }),
    {
      name: "studypass-auth",
      onRehydrateStorage: () => (state) => {
        if (state?.token?.access_token) {
          api.setToken(state.token.access_token);
        }
      },
    }
  )
);

// ---------------------------------------------------------------------------
// Active exam store (in-memory, not persisted)
// ---------------------------------------------------------------------------
interface ExamState {
  sessionId: string | null;
  answers: Record<string, AnswerSubmit>;
  flagged: Set<string>;
  currentIndex: number;
  startedAt: number | null;

  setSession: (id: string) => void;
  setAnswer: (questionId: string, answer: string | null) => void;
  toggleFlag: (questionId: string) => void;
  setCurrentIndex: (i: number) => void;
  reset: () => void;
}

export const useExamStore = create<ExamState>()((set, get) => ({
  sessionId: null,
  answers: {},
  flagged: new Set(),
  currentIndex: 0,
  startedAt: null,

  setSession: (id) => set({ sessionId: id, answers: {}, flagged: new Set(), currentIndex: 0, startedAt: Date.now() }),

  setAnswer: (questionId, answer) =>
    set((s) => ({
      answers: {
        ...s.answers,
        [questionId]: {
          question_id: questionId,
          answer: answer as any,
          flagged: s.flagged.has(questionId),
        },
      },
    })),

  toggleFlag: (questionId) =>
    set((s) => {
      const flagged = new Set(s.flagged);
      if (flagged.has(questionId)) flagged.delete(questionId);
      else flagged.add(questionId);
      return { flagged };
    }),

  setCurrentIndex: (i) => set({ currentIndex: i }),

  reset: () => set({ sessionId: null, answers: {}, flagged: new Set(), currentIndex: 0, startedAt: null }),
}));
