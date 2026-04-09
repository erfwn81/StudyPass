import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "@studypass/core/api/client";

export default function StudyScreen() {
  const [selectedTopic, setSelectedTopic] = useState<string | undefined>();
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
  });

  const course = courses?.courses[0];

  const { data: questions, isLoading } = useQuery({
    queryKey: ["questions", course?.id, selectedTopic],
    queryFn: () => api.getQuestions({ course_id: course!.id, topic: selectedTopic, limit: 100 }),
    enabled: !!course,
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Study Guide</Text>

      {/* Topic filter */}
      {course?.topics && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicsScroll}>
          <TouchableOpacity
            style={[styles.topicPill, !selectedTopic && styles.topicPillActive]}
            onPress={() => setSelectedTopic(undefined)}
          >
            <Text style={[styles.topicPillText, !selectedTopic && styles.topicPillTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          {course.topics.map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.topicPill, selectedTopic === t && styles.topicPillActive]}
              onPress={() => setSelectedTopic(t)}
            >
              <Text style={[styles.topicPillText, selectedTopic === t && styles.topicPillTextActive]}>
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Questions */}
      {isLoading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <View style={styles.questionList}>
          {questions?.questions.map((q, idx) => (
            <TouchableOpacity
              key={q.id}
              style={styles.questionCard}
              onPress={() => setExpandedQ(expandedQ === q.id ? null : q.id)}
            >
              <Text style={styles.questionText}>
                {idx + 1}. {q.question_text}
              </Text>

              {expandedQ === q.id && (
                <View style={styles.optionsContainer}>
                  {(["A", "B", "C", "D"] as const).map((letter) => {
                    const optKey = `option_${letter.toLowerCase()}` as keyof typeof q;
                    const optText = q[optKey] as string | undefined;
                    if (!optText) return null;
                    const isCorrect = q.correct_answer === letter;
                    return (
                      <View
                        key={letter}
                        style={[styles.option, isCorrect && styles.optionCorrect]}
                      >
                        <Text style={[styles.optionText, isCorrect && styles.optionTextCorrect]}>
                          {letter}. {optText}
                        </Text>
                      </View>
                    );
                  })}
                  {q.explanation && (
                    <View style={styles.explanation}>
                      <Text style={styles.explanationText}>
                        <Text style={{ fontWeight: "700" }}>Explanation: </Text>
                        {q.explanation}
                      </Text>
                    </View>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "800", color: "#1e293b", marginBottom: 12 },
  topicsScroll: { marginBottom: 16, flexGrow: 0 },
  topicPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1, borderColor: "#cbd5e1", backgroundColor: "#fff",
    marginRight: 8,
  },
  topicPillActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  topicPillText: { fontSize: 13, color: "#475569" },
  topicPillTextActive: { color: "#fff", fontWeight: "600" },
  loadingText: { color: "#94a3b8", textAlign: "center", marginTop: 40 },
  questionList: { gap: 10 },
  questionCard: {
    backgroundColor: "#fff", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  questionText: { fontSize: 14, color: "#1e293b", fontWeight: "500", lineHeight: 20 },
  optionsContainer: { marginTop: 12, gap: 8 },
  option: {
    padding: 10, borderRadius: 8, backgroundColor: "#f1f5f9",
  },
  optionCorrect: { backgroundColor: "#dcfce7", borderWidth: 1, borderColor: "#86efac" },
  optionText: { fontSize: 13, color: "#334155" },
  optionTextCorrect: { color: "#15803d", fontWeight: "600" },
  explanation: {
    marginTop: 4, padding: 10, backgroundColor: "#eff6ff",
    borderRadius: 8, borderWidth: 1, borderColor: "#bfdbfe",
  },
  explanationText: { fontSize: 13, color: "#1d4ed8", lineHeight: 18 },
});
