import TopBar from "@/src/components/TopBar";
import { supabase } from "@/src/lib/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { FAB } from "react-native-paper";
import ProgressGauge from "../../../src/components/ProgressGauge";
import StatCard from "../../../src/components/StatCard";
import { colors, spacing } from "../../../src/theme/theme";

type Stat = {
  id: string;
  title: string;
  value: number;
  icon:
    | "briefcase-outline"
    | "list-outline"
    | "alarm-outline"
    | "checkmark-done-outline";
};
type ProjectRow = {
  id: string;
  status?: string | null;
  due_date?: string | null;
  title?: string | null;
  progress?: number | null;
};
export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stat[]>([]);
  const [deadlines, setDeadlines] = useState<{ title: string; date: string }[]>(
    [],
  );
  const [overallProgress, setOverallProgress] = useState(0);
  const [fabOpen, setFabOpen] = useState(false);

  const DEFAULT_STATS: Stat[] = [
    { id: "1", title: "Active Projects", value: 5, icon: "briefcase-outline" },
    { id: "2", title: "Tasks Today", value: 7, icon: "list-outline" },
    { id: "3", title: "Due This Week", value: 12, icon: "alarm-outline" },
    { id: "4", title: "Completed", value: 26, icon: "checkmark-done-outline" },
  ];

  const load = useCallback(async () => {
    //manin routng below
    const { data: auth } = await supabase.auth.getUser();
    const user = auth?.user;

    if (!user) {
      setStats([]);
      setDeadlines([]);
      setOverallProgress(0);
      return;
    }

    // Projects for current user
    const { data, error } = await supabase
      .from("projects")
      .select("id, status, due_date, title, progress, user_id")
      // Include current user's projects or legacy rows with null user_id
      .or(`user_id.eq.${user.id},user_id.is.null`);

    if (!error && data) {
      const rows = data as ProjectRow[];
      console.log(
        "Home load: fetched projects",
        rows.length,
        rows.map((p) => ({
          id: p.id,
          status: p.status,
          due_date: p.due_date,
          title: p.title,
          user_id: (p as any).user_id,
        })),
      );
      const active = rows.filter(
        (p) => (p.status ?? "draft") !== "completed",
      ).length;
      const completed = rows.filter(
        (p) => (p.status ?? "draft") === "completed",
      ).length;
      const dueThisWeek = rows.filter(
        (p) => p.due_date && isDueThisWeek(new Date(p.due_date)),
      ).length;
      setStats([
        {
          id: "1",
          title: "Active Projects",
          value: active,
          icon: "briefcase-outline",
        },
        // Tasks Today not yet implemented; keep slot for UI consistency
        { id: "2", title: "Tasks Today", value: 0, icon: "list-outline" },
        {
          id: "3",
          title: "Due This Week",
          value: dueThisWeek,
          icon: "alarm-outline",
        },
        {
          id: "4",
          title: "Completed",
          value: completed,
          icon: "checkmark-done-outline",
        },
      ]);

      // Upcoming deadlines: show ALL projects with status 'pending' (no date filtering)
      const upcoming = rows
        .filter((p) => String(p.status ?? "draft").toLowerCase() === "pending")
        .map((p) => ({
          title: p.title ?? "Untitled",
          date: p.due_date
            ? formatShort(parseDateOnly(p.due_date as string))
            : "No deadline",
        }));
      console.log("Home load: upcoming (pending)", upcoming.length, upcoming);
      setDeadlines(upcoming);

      // Overall progress (avg of progress field if exists, else derived from status)
      const progressValues = rows.map((p) => {
        const status = (p.status ?? "draft") as string;
        const derived =
          status === "completed" ? 1 : status === "pending" ? 0.5 : 0;
        const hasProgress =
          typeof p.progress === "number" ? p.progress / 100 : undefined;
        return typeof hasProgress === "number" ? hasProgress : derived;
      });
      const avg = progressValues.length
        ? progressValues.reduce((a, b) => a + b, 0) / progressValues.length
        : 0;
      setOverallProgress(avg);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const isDueThisWeek = (date: Date) => {
    const now = new Date();
    const in7 = new Date();
    in7.setDate(now.getDate() + 7);
    return date >= now && date <= in7;
  };

  const formatShort = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" });

  // Parse a Supabase date or timestamp into a local date at 00:00 to avoid timezone drift
  const parseDateOnly = (value: string): Date => {
    // Handle YYYY-MM-DD as local date
    const m = /^\d{4}-\d{2}-\d{2}/.exec(value);
    if (m) {
      const [y, mo, d] = m[0].split("-").map((n) => parseInt(n, 10));
      return new Date(y, mo - 1, d, 0, 0, 0, 0);
    }
    // Fallback to JS Date and then normalize to day-start
    const dt = new Date(value);
    dt.setHours(0, 0, 0, 0);
    return dt;
  };

  return (
    <View style={styles.container}>
      {/* Top Bar */}
      <TopBar title="Home" />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing.xl }}>
        {/* Dashboard */}
        <Text style={styles.sectionTitle}>Dashboard</Text>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: spacing.md }}
          data={stats.length ? stats : DEFAULT_STATS}
          keyExtractor={(i) => i.id}
          renderItem={({ item }) => (
            <StatCard title={item.title} value={item.value} icon={item.icon} />
          )}
        />

        {/* Progress Gauge */}
        <Text style={styles.sectionTitle}>Progress</Text>
        <ProgressGauge progress={overallProgress} />

        {/* Quick Actions (moved here) */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(protected)/addProjects")}
          >
            <Ionicons
              name="add-circle-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.quickBtnText}>Add Project</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(protected)/(tabs)/calendar")}
          >
            <Ionicons
              name="calendar-outline"
              size={22}
              color={colors.primary}
            />
            <Text style={styles.quickBtnText}>Calendar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickBtn}
            onPress={() => router.push("/(protected)/(tabs)/progress")}
          >
            <Ionicons name="albums-outline" size={22} color={colors.primary} />
            <Text style={styles.quickBtnText}>Projects</Text>
          </TouchableOpacity>
        </View>

        {/* AI Insights */}
        <Text style={styles.sectionTitle}>AI Insights</Text>
        <TouchableOpacity
          style={styles.aiCard}
          onPress={() => router.push("/(protected)/(tabs)/progress")}
        >
          <Ionicons name="sparkles-outline" size={24} color={colors.primary} />
          <View style={{ marginLeft: spacing.sm }}>
            <Text style={styles.aiCardTitle}>Boost your productivity</Text>
            <Text style={styles.aiCardSubtitle}>
              “You have 3 tasks that can be completed today to reach 85% of your
              goal.”
            </Text>
          </View>
        </TouchableOpacity>

        {/* Upcoming Deadlines */}
        <Text style={styles.sectionTitle}>Upcoming Deadlines</Text>
        <View style={styles.deadlineList}>
          {deadlines.length === 0 ? (
            <Text style={{ color: colors.textSecondary }}>
              No upcoming deadlines
            </Text>
          ) : (
            deadlines.map((d, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.deadlineItem}
                onPress={() => router.push("/(protected)/(tabs)/calendar")}
              >
                <Text style={styles.deadlineTitle}>{d.title}</Text>
                <Text style={styles.deadlineDate}>{d.date}</Text>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <FAB.Group
        open={fabOpen}
        icon={fabOpen ? "close" : "plus"}
        actions={[
          {
            icon: "plus",
            label: "Add Project",
            onPress: () => router.push("/(protected)/addProjects"),
          },
          {
            icon: "calendar",
            label: "Calendar",
            onPress: () => router.push("/(protected)/(tabs)/calendar"),
          },
        ]}
        onStateChange={({ open }) => setFabOpen(open)}
        fabStyle={{ backgroundColor: colors.primary }}
        visible={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.textPrimary,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: spacing.sm,
    backgroundColor: "#fff",
    elevation: 2,
    marginHorizontal: spacing.md,
    borderRadius: 12,
  },
  quickBtn: { alignItems: "center" },
  quickBtnText: { fontSize: 12, marginTop: 2, color: colors.textPrimary },

  aiCard: {
    flexDirection: "row",
    backgroundColor: "#fff",
    marginHorizontal: spacing.md,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: "center",
    elevation: 2,
  },
  aiCardTitle: { fontWeight: "700", color: colors.textPrimary },
  aiCardSubtitle: { fontSize: 13, color: colors.textSecondary },

  deadlineList: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
  },
  deadlineItem: {
    paddingVertical: spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  deadlineTitle: { color: colors.textPrimary, fontWeight: "600" },
  deadlineDate: { color: colors.secondary, fontWeight: "700" },
});
