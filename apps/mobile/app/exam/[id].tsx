import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useState, useEffect } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { api } from "@studypass/core/api/client";
import type { Question } from "@studypass/core/types";
import AsyncStorage from "@react-native-async-storage/async-storage";

type AnswerMap = Record<string, string | null>;
type FlagSet = Record<string, boolean>;

export default function ExamScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [flagged, setFlagged] = useState<FlagSet>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(`exam_${id}`).then((stored) => {
      if (stored) setQuestions(JSON.parse(stored));
    });
  }, [id]);

  const currentQ = questions[currentIndex];
  const total = questions.length;
  const answeredCount = Object.values(answers).filter(Boolean).length;
  const selectedAnswer = currentQ ? answers[currentQ.id] : undefined;
  const isFlagged = currentQ ? !!flagged[currentQ.id] : false;

  const handleAnswer = (letter: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: letter }));
  };

  const toggleFlag = () => {
    if (!currentQ) return;
    setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }));
  };

  const handleSubmit = () => {
    const unanswered = total - answeredCount;
    Alert.alert(
      "Submit Exam",
      unanswered > 0
        ? `You have ${unanswered} unanswered questions. They will be marked wrong. Submit anyway?`
        : "Are you sure you want to submit your exam?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Submit",
          style: "destructive",
          onPress: async () => {
            setSubmitting(true);
            const answerList = questions.map((q) => ({
              question_id: q.id,
              answer: answers[q.id] ?? null,
              flagged: !!flagged[q.id],
            }));
            await api.submitExam(id!, { answers: answerList });
            router.replace(`/results/${id}` as any);
          },
        },
      ]
    );
  };

  if (!currentQ) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading exam...</Text>
      </View>
    );
  }

  const options: Array<{ letter: "A" | "B" | "C" | "D"; text?: string }> = [
    { letter: "A", text: currentQ.option_a ?? undefined },
    { letter: "B", text: currentQ.option_b ?? undefined },
    { letter: "C", text: currentQ.option_c ?? undefined },
    { letter: "D", text: currentQ.option_d ?? undefined },
  ].filter((o) => o.text);

  return (
    <View style={styles.container}>
      {/* Progress */}
      <View style={styles.progressBar}>
        <View style={styles.progressInfo}>
          <Text style={styles.progressText}>
            Question {currentIndex + 1} of {total}
          </Text>
          <Text style={styles.progressText}>{answeredCount} answered</Text>
        </View>
        <View style={styles.progressTrack}>
          <View
            style={[styles.progressFill, { width: `${((currentIndex + 1) / total) * 100}%` as any }]}
          />
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Question */}
        <View style={styles.questionCard}>
          <View style={styles.questionHeader}>
            <Text style={styles.questionText}>{currentQ.question_text}</Text>
            <TouchableOpacity onPress={toggleFlag} style={styles.flagBtn}>
              <Text style={[styles.flagText, isFlagged && styles.flagTextActive]}>
                {isFlagged ? "🚩" : "⚑"}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.optionsList}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.letter}
                style={[
                  styles.optionBtn,
                  selectedAnswer === opt.letter && styles.optionBtnSelected,
                ]}
                onPress={() => handleAnswer(opt.letter)}
              >
                <View
                  style={[
                    styles.optionCircle,
                    selectedAnswer === opt.letter && styles.optionCircleSelected,
                  ]}
                >
                  <Text
                    style={[
                      styles.optionLetter,
                      selectedAnswer === opt.letter && styles.optionLetterSelected,
                    ]}
                  >
                    {opt.letter}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.optionText,
                    selectedAnswer === opt.letter && styles.optionTextSelected,
                  ]}
                >
                  {opt.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Footer navigation */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.navBtn, currentIndex === 0 && styles.navBtnDisabled]}
          onPress={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          disabled={currentIndex === 0}
        >
          <Text style={styles.navBtnText}>← Prev</Text>
        </TouchableOpacity>

        {currentIndex < total - 1 ? (
          <TouchableOpacity
            style={styles.navBtnPrimary}
            onPress={() => setCurrentIndex((i) => i + 1)}
          >
            <Text style={styles.navBtnPrimaryText}>Next →</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtnPrimary, { backgroundColor: "#16a34a" }]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            <Text style={styles.navBtnPrimaryText}>
              {submitting ? "Submitting..." : "Submit"}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#94a3b8" },
  progressBar: {
    backgroundColor: "#fff", padding: 12, borderBottomWidth: 1, borderBottomColor: "#e2e8f0",
  },
  progressInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressText: { fontSize: 12, color: "#64748b" },
  progressTrack: { height: 4, backgroundColor: "#e2e8f0", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, backgroundColor: "#3b82f6", borderRadius: 2 },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  questionCard: { backgroundColor: "#fff", borderRadius: 12, padding: 16, borderWidth: 1, borderColor: "#e2e8f0" },
  questionHeader: { flexDirection: "row", gap: 10 },
  questionText: { flex: 1, fontSize: 16, fontWeight: "600", color: "#1e293b", lineHeight: 24 },
  flagBtn: { padding: 4 },
  flagText: { fontSize: 20, opacity: 0.3 },
  flagTextActive: { opacity: 1 },
  optionsList: { marginTop: 16, gap: 10 },
  optionBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 10, borderWidth: 2, borderColor: "#e2e8f0", backgroundColor: "#fff",
  },
  optionBtnSelected: { borderColor: "#3b82f6", backgroundColor: "#eff6ff" },
  optionCircle: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: "#f1f5f9",
    alignItems: "center", justifyContent: "center",
  },
  optionCircleSelected: { backgroundColor: "#3b82f6" },
  optionLetter: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  optionLetterSelected: { color: "#fff" },
  optionText: { flex: 1, fontSize: 14, color: "#334155" },
  optionTextSelected: { color: "#1d4ed8", fontWeight: "500" },
  footer: {
    flexDirection: "row", gap: 12, padding: 16,
    backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#e2e8f0",
  },
  navBtn: {
    flex: 1, padding: 14, borderRadius: 10, borderWidth: 1,
    borderColor: "#e2e8f0", alignItems: "center",
  },
  navBtnDisabled: { opacity: 0.4 },
  navBtnText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  navBtnPrimary: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: "#2563eb", alignItems: "center",
  },
  navBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
});
