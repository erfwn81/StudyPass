import axios, { AxiosInstance } from "axios";
import type {
  Course, Question, ExamSession, ExamResult, ExamHistoryItem,
  ProgressSummary, AuthToken, ExamStartPayload, ExamSubmitPayload,
} from "../types";

const DEFAULT_API_URL =
  typeof process !== "undefined"
    ? process.env.NEXT_PUBLIC_API_URL ||
      process.env.EXPO_PUBLIC_API_URL ||
      "http://localhost:8000"
    : "http://localhost:8000";

class StudyPassAPI {
  private client: AxiosInstance;

  constructor(baseURL: string = DEFAULT_API_URL) {
    this.client = axios.create({ baseURL });
  }

  setToken(token: string) {
    this.client.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  clearToken() {
    delete this.client.defaults.headers.common["Authorization"];
  }

  // Auth
  async register(email: string, password: string, name?: string): Promise<AuthToken> {
    const { data } = await this.client.post("/auth/register", { email, password, name });
    return data;
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const { data } = await this.client.post("/auth/login", { email, password });
    return data;
  }

  // Courses
  async getCourses(): Promise<{ courses: Course[]; total: number }> {
    const { data } = await this.client.get("/courses");
    return data;
  }

  async getCourse(id: string): Promise<Course> {
    const { data } = await this.client.get(`/courses/${id}`);
    return data;
  }

  // Questions
  async getQuestions(params: {
    course_id?: string;
    topic?: string;
    source?: string;
    difficulty?: string;
    limit?: number;
    offset?: number;
    random?: boolean;
  }): Promise<{ questions: Question[]; total: number }> {
    const { data } = await this.client.get("/questions", { params });
    return data;
  }

  async getQuestion(id: string): Promise<Question> {
    const { data } = await this.client.get(`/questions/${id}`);
    return data;
  }

  // Exams
  async startExam(payload: ExamStartPayload): Promise<ExamSession> {
    const { data } = await this.client.post("/exams/start", payload);
    return data;
  }

  async submitExam(sessionId: string, payload: ExamSubmitPayload): Promise<ExamResult> {
    const { data } = await this.client.post(`/exams/${sessionId}/submit`, payload);
    return data;
  }

  async getExamResults(sessionId: string): Promise<ExamResult> {
    const { data } = await this.client.get(`/exams/${sessionId}/results`);
    return data;
  }

  async getExamHistory(): Promise<{ exams: ExamHistoryItem[]; total: number }> {
    const { data } = await this.client.get("/exams/history");
    return data;
  }

  // Progress
  async getProgressSummary(): Promise<ProgressSummary> {
    const { data } = await this.client.get("/progress/summary");
    return data;
  }

  async getTopicBreakdown(): Promise<{ topics: import("../types").WeakTopic[] }> {
    const { data } = await this.client.get("/progress/topics");
    return data;
  }
}

export const api = new StudyPassAPI();
export default StudyPassAPI;
