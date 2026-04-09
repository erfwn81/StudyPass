import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@studypass/core/api/client";
import type { ExamAnswerResult } from "@studypass/core/types";

export default function ResultsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const { data: result, isLoading } = useQuery({
    queryKey: ["results", id],
    queryFn: () => api.getExamResults(id!),
    enabled: !!id,
  });

  if (isLoading || !result) {
    return (
      <View style={styles.centered}>
        <Text style={styles.loadingText}>Loading results...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Score */}
      <View
        style={[
          styles.scoreCard,
          { borderColor: result.passed ? "#4ade80" : "#f87171" },
        ]}
      >
        <Text style={[styles.bigScore, { color: result.passed ? "#16a34a" : "#dc2626" }]}>
          {result.percentage.toFixed(1)}%
        </Text>
        <Text style={styles.scoreDetail}>
          {result.score} / {result.total} correct
        </Text>
        <View
          style={[
            styles.badge,
            { backgroundColor: result.passed ? "#dcfce7" : "#fee2e2" },
          ]}
        >
          <Text style={{ color: result.passed ? "#15803d" : "#b91c1c", fontWeight: "700" }}>
            {result.passed ? "PASSED" : "NOT PASSED"}
          </Text>
        </View>
        <Text style={styles.passingNote}>Passing: {result.passing_score}%</Text>
      </View>

      {/* Topic breakdown */}
      {result.topic_breakdown.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>By Topic</Text>
          {result.topic_breakdown.map((t) => (
            <View key={t.topic} style={styles.topicRow}>
              <View style={styles.topicHeader}>
                <Text style={styles.topicName}>{t.topic}</Text>
                <Text
                  style={[
                    styles.topicPct,
                    { color: t.percentage >= 70 ? "#16a34a" : t.percentage >= 50 ? "#d97706" : "#dc2626" },
                  ]}
                >
                  {t.percentage.toFixed(0)}% ({t.correct}/{t.total})
                </Text>
              </View>
              <View style={styles.barBg}>
                <View
                  style={[
                    styles.barFill,
                    {
                      width: `${t.percentage}%` as any,
                      backgroundColor:
                        t.percentage >= 70 ? "#4ade80" : t.percentage >= 50 ? "#fbbf24" : "#f87171",
                    },
                  ]}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.btnSecondary} onPress={() => router.push("/" as any)}>
          <Text style={styles.btnSecondaryText}>Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnPrimary} onPress={() => router.push("/" as any)}>
          <Text style={styles.btnPrimaryText}>New Exam</Text>
        </TouchableOpacity>
      </View>

      {/* Answer review */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Answer Review</Text>
        {result.answers.map((ar, idx) => (
          <AnswerItem
            key={ar.question.id}
            idx={idx}
            answerResult={ar}
            expanded={expandedQ === ar.question.id}
            onToggle={() => setExpandedQ(expandedQ === ar.question.id ? null : ar.question.id)}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function AnswerItem({
  idx,
  answerResult,
  expanded,
  onToggle,
}: {
  idx: number;
  answerResult: ExamAnswerResult;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { question, user_answer, is_correct } = answerResult;
  const options: Array<{ letter: "A" | "B" | "C" | "D"; text?: string }> = [
    { letter: "A", text: question.option_a ?? undefined },
    { letter: "B", text: question.option_b ?? undefined },
    { letter: "C", text: question.option_c ?? undefined },
    { letter: "D", text: question.option_d ?? undefined },
  ].filter((o) => o.text);

  return (
    <TouchableOpacity
      style={[
        styles.answerCard,
        { borderLeftColor: is_correct ? "#4ade80" : "#f87171", borderLeftWidth: 3 },
      ]}
      onPress={onToggle}
    >
      <View style={styles.answerHeader}>
        <Text style={styles.answerNum}>{idx + 1}.</Text>
        <Text style={[styles.answerIcon]}>{is_correct ? "✓" : "✗"}</Text>
        <Text style={styles.answerQuestion} numberOfLines={expanded ? undefined : 2}>
          {question.question_text}
        </Text>
      </View>

      {expanded && (
        <View style={styles.answerOptions}>
          {options.map((opt) => {
            const isUser = user_answer === opt.letter;
            const isCorrect = question.correct_answer === opt.letter;
            return (
              <View
                key={opt.letter}
                style={[
                  styles.optRow,
                  isCorrect && styles.optRowCorrect,
                  isUser && !isCorrect && styles.optRowWrong,
                ]}
              >
                <Text style={styles.optLetter}>{opt.letter}.</Text>
                <Text
                  style={[
                    styles.optText,
                    isCorrect && { color: "#15803d" },
                    isUser && !isCorrect && { color: "#b91c1c" },
                  ]}
                >
                  {opt.text}
                </Text>
              </View>
            );
          })}
          {question.explanation && (
            <View style={styles.explBox}>
              <Text style={styles.explText}>
                <Text style={{ fontWeight: "700" }}>Explanation: </Text>
                {question.explanation}
              </Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 40 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#94a3b8" },
  scoreCard: {
    backgroundColor: "#fff", borderRadius: 16, borderWidth: 2,
    padding: 24, alignItems: "center", marginBottom: 20,
  },
  bigScore: { fontSize: 56, fontWeight: "800" },
  scoreDetail: { fontSize: 18, color: "#64748b", marginTop: 4 },
  badge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginTop: 10 },
  passingNote: { fontSize: 12, color: "#94a3b8", marginTop: 6 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 10 },
  topicRow: { marginBottom: 10 },
  topicHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  topicName: { fontSize: 13, color: "#475569" },
  topicPct: { fontSize: 13, fontWeight: "600" },
  barBg: { height: 8, backgroundColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  actions: { flexDirection: "row", gap: 12, marginBottom: 20 },
  btnSecondary: {
    flex: 1, padding: 14, borderRadius: 10,
    borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center",
  },
  btnSecondaryText: { fontSize: 14, fontWeight: "600", color: "#475569" },
  btnPrimary: {
    flex: 1, padding: 14, borderRadius: 10,
    backgroundColor: "#2563eb", alignItems: "center",
  },
  btnPrimaryText: { fontSize: 14, fontWeight: "700", color: "#fff" },
  answerCard: {
    backgroundColor: "#fff", borderRadius: 10, padding: 12,
    marginBottom: 8, borderWidth: 1, borderColor: "#e2e8f0",
  },
  answerHeader: { flexDirection: "row", gap: 6, alignItems: "flex-start" },
  answerNum: { fontSize: 13, color: "#94a3b8", minWidth: 22 },
  answerIcon: { fontSize: 14, fontWeight: "700" },
  answerQuestion: { flex: 1, fontSize: 13, color: "#1e293b", lineHeight: 18 },
  answerOptions: { marginTop: 10, gap: 6 },
  optRow: {
    flexDirection: "row", gap: 6, padding: 8,
    backgroundColor: "#f8fafc", borderRadius: 6,
  },
  optRowCorrect: { backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac" },
  optRowWrong: { backgroundColor: "#fee2e2", borderWidth: 1, borderColor: "#fca5a5" },
  optLetter: { fontSize: 13, fontWeight: "700", color: "#64748b", minWidth: 20 },
  optText: { flex: 1, fontSize: 13, color: "#334155" },
  explBox: {
    padding: 8, backgroundColor: "#eff6ff",
    borderRadius: 6, borderWidth: 1, borderColor: "#bfdbfe",
  },
  explText: { fontSize: 12, color: "#1d4ed8", lineHeight: 17 },
});
