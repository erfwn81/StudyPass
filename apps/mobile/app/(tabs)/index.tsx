import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { api } from "@studypass/core/api/client";

export default function DashboardScreen() {
  const router = useRouter();

  const { data: courses } = useQuery({
    queryKey: ["courses"],
    queryFn: () => api.getCourses(),
  });

  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: () => api.getProgressSummary(),
  });

  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getExamHistory(),
  });

  const course = courses?.courses[0];
  const lastExam = history?.exams[0];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>StudyPass</Text>
      <Text style={styles.subtitle}>CA Real Estate Exam Prep</Text>

      {/* Stats */}
      {progress && (
        <View style={styles.statsRow}>
          <StatBox label="Avg Score" value={`${progress.average_score.toFixed(0)}%`} />
          <StatBox label="Exams" value={String(progress.total_exams)} />
          <StatBox label="Streak" value={`${progress.streak_days}d`} />
        </View>
      )}

      {/* Quick start */}
      {course && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Start</Text>
          <View style={styles.buttonGrid}>
            {[
              { label: "Full Exam\n150 questions", mode: "full", count: 150 },
              { label: "Quick Quiz\n25 questions", mode: "quick", count: 25 },
              { label: "Half Exam\n50 questions", mode: "half", count: 50 },
              { label: "Mini Quiz\n10 questions", mode: "mini", count: 10 },
            ].map((m) => (
              <TouchableOpacity
                key={m.mode}
                style={styles.modeBtn}
                onPress={() =>
                  router.push(
                    `/exam/start?course_id=${course.id}&mode=${m.mode}&count=${m.count}` as any
                  )
                }
              >
                <Text style={styles.modeBtnText}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {/* Last exam */}
      {lastExam && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Last Exam</Text>
          <View style={styles.card}>
            <Text style={[styles.bigScore, { color: lastExam.passed ? "#16a34a" : "#dc2626" }]}>
              {lastExam.percentage?.toFixed(1)}%
            </Text>
            <Text style={styles.scoreDetail}>
              {lastExam.score}/{lastExam.total_q} · {lastExam.mode}
            </Text>
            <TouchableOpacity
              style={[styles.btn, { marginTop: 12 }]}
              onPress={() => router.push(`/results/${lastExam.session_id}` as any)}
            >
              <Text style={styles.btnText}>Review Answers</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#1d4ed8", marginBottom: 2 },
  subtitle: { fontSize: 14, color: "#64748b", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  statBox: {
    flex: 1, backgroundColor: "#fff", borderRadius: 12,
    padding: 14, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 10 },
  buttonGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  modeBtn: {
    width: "47%", backgroundColor: "#fff", borderRadius: 12,
    padding: 16, borderWidth: 1, borderColor: "#e2e8f0",
  },
  modeBtnText: { fontSize: 13, fontWeight: "600", color: "#1e40af", lineHeight: 20 },
  card: {
    backgroundColor: "#fff", borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  bigScore: { fontSize: 36, fontWeight: "800" },
  scoreDetail: { fontSize: 14, color: "#64748b", marginTop: 2 },
  btn: {
    backgroundColor: "#2563eb", borderRadius: 8, padding: 12, alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "600", fontSize: 14 },
});
