import { View, Text, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { api } from "@studypass/core/api/client";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function StartExamScreen() {
  const { course_id, mode, count, topic } = useLocalSearchParams<{
    course_id: string;
    mode: string;
    count: string;
    topic?: string;
  }>();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const modeLabels: Record<string, string> = {
    full: "Full Exam — 150 questions",
    half: "Half Exam — 50 questions",
    quick: "Quick Quiz — 25 questions",
    mini: "Mini Quiz — 10 questions",
  };

  const handleStart = async () => {
    setLoading(true);
    try {
      const session = await api.startExam({
        course_id: course_id!,
        mode: mode as any,
        question_count: count ? Number(count) : undefined,
        topic: topic ?? undefined,
      });
      // Cache questions for the exam screen
      await AsyncStorage.setItem(`exam_${session.session_id}`, JSON.stringify(session.questions));
      router.replace(`/exam/${session.session_id}` as any);
    } catch (err: any) {
      Alert.alert("Error", err.response?.data?.detail || "Failed to start exam.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Ready?</Text>
        <Text style={styles.subtitle}>{modeLabels[mode!] ?? "Exam"}</Text>
        {topic && <Text style={styles.topic}>Topic: {topic}</Text>}

        <View style={styles.rules}>
          <Text style={styles.rule}>• Answer all questions before submitting</Text>
          <Text style={styles.rule}>• Flag questions to mark for review</Text>
          <Text style={styles.rule}>• Answers revealed only after submission</Text>
          <Text style={styles.rule}>• Passing score: 70%</Text>
        </View>

        <View style={styles.btnRow}>
          <TouchableOpacity style={styles.btnSecondary} onPress={() => router.back()}>
            <Text style={styles.btnSecondaryText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnPrimary} onPress={handleStart} disabled={loading}>
            <Text style={styles.btnPrimaryText}>{loading ? "Starting..." : "Start Exam"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", alignItems: "center", justifyContent: "center", padding: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 16, padding: 24,
    width: "100%", borderWidth: 1, borderColor: "#e2e8f0",
  },
  title: { fontSize: 24, fontWeight: "800", color: "#1e293b", textAlign: "center" },
  subtitle: { fontSize: 16, color: "#64748b", textAlign: "center", marginTop: 6 },
  topic: { fontSize: 14, color: "#2563eb", textAlign: "center", marginTop: 4 },
  rules: {
    backgroundColor: "#eff6ff", borderRadius: 10, padding: 14, marginVertical: 20, gap: 6,
  },
  rule: { fontSize: 13, color: "#1d4ed8" },
  btnRow: { flexDirection: "row", gap: 12 },
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
});
