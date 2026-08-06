import TopBar from "@/src/components/TopBar";
import { useSidebar } from "@/src/context/SidebarContext";
import { supabase } from "@/src/lib/supabase";
import * as Notifications from "expo-notifications";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Button, FlatList, StyleSheet, Text, View } from "react-native";
import { Calendar } from "react-native-calendars";
import { colors, spacing } from "../../../src/theme/theme";

export default function CalendarScreen() {
  const openSidebar = useSidebar();
  const [projects, setProjects] = useState<any[]>([]);

  // Fetch only pending projects
  useEffect(() => {
    const fetchProjects = async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("status", "pending");

      if (error) {
        console.error(error);
        Alert.alert("Error fetching projects", error.message);
      } else {
        setProjects(data);
      }
    };

    fetchProjects();
  }, []);

  // Mark deadlines on the calendar
  const marked = useMemo(() => {
    const marks: Record<string, any> = {};
    projects.forEach((project) => {
      if (project.due_date) {
        const dateStr = project.due_date.split("T")[0]; // format YYYY-MM-DD
        marks[dateStr] = {
          marked: true,
          dotColor: colors.secondary,
          selectedColor: colors.primary,
        };
      }
    });
    return marks;
  }, [projects]);

  // Schedule local notification
  const scheduleNotification = async (project: any) => {
    if (!project.due_date) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: `Reminder: ${project.title}`,
        body: `Project "${project.title}" is due soon.`,
      },
      trigger: new Date(project.due_date), // fire at deadline
    });

    Alert.alert("Alarm Set", `Notification scheduled for ${project.title}`);
  };

  return (
    <View style={styles.container}>
      <TopBar
        title="Calendar"
        onMenuPress={openSidebar}
        profileImage="https://via.placeholder.com/150"
      />

      <View style={styles.card}>
        <Calendar
          theme={{
            backgroundColor: "#fff",
            calendarBackground: "#fff",
            textSectionTitleColor: colors.primary,
            selectedDayBackgroundColor: colors.primary,
            selectedDayTextColor: "#fff",
            todayTextColor: colors.secondary,
            dayTextColor: colors.textPrimary,
            monthTextColor: colors.primary,
            textDayFontSize: 14,
            textMonthFontSize: 16,
            textDayHeaderFontSize: 12,
          }}
          markedDates={marked}
        />
      </View>

      <View style={styles.listCard}>
        <Text style={styles.heading}>Upcoming Pending Projects</Text>

        <FlatList
          data={projects}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={styles.itemRow}>
              <Text style={styles.item}>
                • {item.title} —{" "}
                {item.due_date
                  ? new Date(item.due_date).toLocaleString()
                  : "No deadline"}
              </Text>
              <Button
                title="Set Alarm"
                onPress={() => scheduleNotification(item)}
              />
            </View>
          )}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  card: {
    backgroundColor: "#fff",
    margin: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  listCard: {
    backgroundColor: "#fff",
    marginHorizontal: spacing.md,
    borderRadius: 16,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: "#eee",
  },
  heading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  itemRow: {
    marginBottom: spacing.sm,
  },
  item: {
    color: colors.textSecondary,
    marginBottom: 6,
  },
});
