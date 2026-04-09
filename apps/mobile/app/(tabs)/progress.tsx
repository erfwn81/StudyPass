import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { api } from "@studypass/core/api/client";

export default function ProgressScreen() {
  const { data: progress } = useQuery({
    queryKey: ["progress"],
    queryFn: () => api.getProgressSummary(),
  });

  const { data: history } = useQuery({
    queryKey: ["history"],
    queryFn: () => api.getExamHistory(),
  });

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Progress</Text>

      {progress && (
        <>
          {/* Summary stats */}
          <View style={styles.statsGrid}>
            <StatCard label="Total Exams" value={String(progress.total_exams)} />
            <StatCard label="Avg Score" value={`${progress.average_score.toFixed(1)}%`} />
            <StatCard label="Best Score" value={`${progress.best_score.toFixed(1)}%`} />
            <StatCard label="Day Streak" value={`${progress.streak_days}`} />
          </View>

          {/* Weak topics */}
          {progress.weak_topics.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Topic Performance</Text>
              {progress.weak_topics.map((t) => (
                <View key={t.topic} style={styles.topicRow}>
                  <View style={styles.topicHeader}>
                    <Text style={styles.topicName}>{t.topic}</Text>
                    <Text
                      style={[
                        styles.topicPct,
                        { color: t.percentage < 60 ? "#dc2626" : t.percentage < 75 ? "#d97706" : "#16a34a" },
                      ]}
                    >
                      {t.percentage.toFixed(0)}%
                    </Text>
                  </View>
                  <View style={styles.barBg}>
                    <View
                      style={[
                        styles.barFill,
                        {
                          width: `${t.percentage}%` as any,
                          backgroundColor: t.percentage < 60 ? "#f87171" : t.percentage < 75 ? "#fbbf24" : "#4ade80",
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}
        </>
      )}

      {/* Exam history */}
      {history && history.exams.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Exam History</Text>
          {history.exams.slice(0, 10).map((exam) => (
            <View key={exam.session_id} style={styles.historyRow}>
              <View>
                <Text style={styles.historyMode}>{exam.mode} mode</Text>
                <Text style={styles.historyDate}>
                  {new Date(exam.started_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={styles.historyScore}>
                <Text
                  style={[
                    styles.historyPct,
                    { color: exam.passed ? "#16a34a" : "#dc2626" },
                  ]}
                >
                  {exam.percentage?.toFixed(1)}%
                </Text>
                <Text style={styles.historyRaw}>
                  {exam.score}/{exam.total_q}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
  title: { fontSize: 22, fontWeight: "800", color: "#1e293b", marginBottom: 16 },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  statCard: {
    width: "47%", backgroundColor: "#fff", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#e2e8f0", alignItems: "center",
  },
  statValue: { fontSize: 22, fontWeight: "700", color: "#1e293b" },
  statLabel: { fontSize: 11, color: "#94a3b8", marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#334155", marginBottom: 10 },
  topicRow: { marginBottom: 10 },
  topicHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  topicName: { fontSize: 13, color: "#475569" },
  topicPct: { fontSize: 13, fontWeight: "600" },
  barBg: { height: 8, backgroundColor: "#e2e8f0", borderRadius: 4, overflow: "hidden" },
  barFill: { height: 8, borderRadius: 4 },
  historyRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    backgroundColor: "#fff", borderRadius: 10, padding: 12, marginBottom: 8,
    borderWidth: 1, borderColor: "#e2e8f0",
  },
  historyMode: { fontSize: 14, fontWeight: "600", color: "#1e293b", textTransform: "capitalize" },
  historyDate: { fontSize: 12, color: "#94a3b8", marginTop: 2 },
  historyScore: { alignItems: "flex-end" },
  historyPct: { fontSize: 18, fontWeight: "700" },
  historyRaw: { fontSize: 12, color: "#94a3b8" },
});
