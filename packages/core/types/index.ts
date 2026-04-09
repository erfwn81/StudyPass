// Shared TypeScript types for StudyPass

export interface Course {
  id: string;
  name: string;
  description?: string;
  state?: string;
  passing_score: number;
  created_at: string;
  question_count?: number;
  topics?: string[];
}

export interface Question {
  id: string;
  course_id: string;
  question_text: string;
  option_a?: string;
  option_b?: string;
  option_c?: string;
  option_d?: string;
  correct_answer?: string; // A/B/C/D — only present in results
  explanation?: string;
  topic?: string;
  difficulty: "easy" | "medium" | "hard";
  source?: string;
  created_at: string;
}

export type AnswerLetter = "A" | "B" | "C" | "D";

export interface ExamStartPayload {
  course_id: string;
  mode: "full" | "quick" | "mini" | "half" | "topic";
  question_count?: number;
  topic?: string;
}

export interface ExamSession {
  session_id: string;
  questions: Question[];
  total: number;
  mode: string;
  started_at: string;
}

export interface AnswerSubmit {
  question_id: string;
  answer: AnswerLetter | null;
  flagged: boolean;
}

export interface ExamSubmitPayload {
  answers: AnswerSubmit[];
}

export interface TopicScore {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ExamAnswerResult {
  question: Question;
  user_answer: AnswerLetter | null;
  is_correct: boolean | null;
  flagged: boolean;
}

export interface ExamResult {
  session_id: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  passing_score: number;
  submitted_at: string;
  topic_breakdown: TopicScore[];
  answers: ExamAnswerResult[];
}

export interface ExamHistoryItem {
  session_id: string;
  mode: string;
  score?: number;
  total_q: number;
  percentage?: number;
  passed?: boolean;
  started_at: string;
  submitted_at?: string;
}

export interface WeakTopic {
  topic: string;
  correct: number;
  total: number;
  percentage: number;
}

export interface ScoreTrend {
  date: string;
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
}

export interface ProgressSummary {
  total_exams: number;
  average_score: number;
  best_score: number;
  streak_days: number;
  score_trend: ScoreTrend[];
  weak_topics: WeakTopic[];
}

export interface AuthToken {
  access_token: string;
  token_type: string;
  user_id: string;
  email: string;
  name?: string;
}
