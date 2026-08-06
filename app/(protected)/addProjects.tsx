import TopBar from "@/src/components/TopBar";
import { MaterialIcons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../src/lib/supabase";
import { colors, spacing } from "../../src/theme/theme";

const colorOptions = ["#FF6B6B", "#FFD93D", "#6BCB77", "#4D96FF", "#B983FF"];
const typeOptions = ["Urgent", "Freestyle", "Test Project"];

export default function AddProject() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId?: string }>();
  const isEditing = Boolean(projectId);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [color, setColor] = useState(colorOptions[0]);
  const [type, setType] = useState(typeOptions[0]);
  const [saving, setSaving] = useState(false);
  const [loadingProject, setLoadingProject] = useState(false);
  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const saveProject = async () => {
    if (!title.trim()) {
      Alert.alert("Validation Error", "Project title is required");
      return;
    }

    setSaving(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("User not logged in");
      }

      if (isEditing && projectId) {
        const { error } = await supabase
          .from("projects")
          .update({
            title,
            desc,
            due_date: date.toISOString(),
            color,
            type,
          })
          .eq("id", projectId as string);

        if (error) throw error;
      } else {
        // Create new project
        const { error } = await supabase.from("projects").insert({
          title,
          desc,
          due_date: date.toISOString(),
          color,
          type,
          status: "draft",
          user_id: user.id,
        });
        if (error) throw error;
      }

      router.back();
    } catch (err: any) {
      console.error(err);
      Alert.alert("Error", err?.message || "Failed to save project");
    } finally {
      setSaving(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios"); // keep picker open on iOS
    if (selectedDate) setDate(selectedDate);
  };

  useEffect(() => {
    const loadProject = async () => {
      if (!projectId) return;
      try {
        setLoadingProject(true);
        const { data, error } = await supabase
          .from("projects")
          .select("*")
          .eq("id", projectId as string)
          .single();
        if (error) throw error;
        if (data) {
          setTitle(data.title || "");
          setDesc(data.desc || "");
          setDate(data.due_date ? new Date(data.due_date) : new Date());
          setColor(data.color || colorOptions[0]);
          setType(data.type || typeOptions[0]);
        }
      } catch (e: any) {
        Alert.alert("Error", e?.message || "Failed to load project");
      } finally {
        setLoadingProject(false);
      }
    };
    loadProject();
  }, [projectId]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <TopBar
        title={isEditing ? "Edit Project" : "Add Project"}
        showBackButton={true}
      />
      <ScrollView style={styles.container}>
        {/* Project Title */}
        <View style={styles.card}>
          <Text style={styles.label}>Project Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter project name"
          />
        </View>

        {/* Description */}
        <View style={styles.card}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 100, textAlignVertical: "top" }]}
            value={desc}
            onChangeText={setDesc}
            multiline
            placeholder="Describe the project..."
          />
        </View>

        {/* Deadline */}
        <View style={styles.card}>
          <Text style={styles.label}>Deadline</Text>
          <TouchableOpacity
            onPress={() => setShowDatePicker(true)}
            style={styles.dateButton}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="calendar-today"
              size={18}
              color="#666"
              style={{ marginRight: 8 }}
            />
            <Text>{date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onDateChange}
            />
          )}
        </View>

        {/* Project Color */}
        <View style={styles.card}>
          <Text style={styles.label}>Project Color</Text>
          <View style={styles.colorRow}>
            {colorOptions.map((c) => (
              <TouchableOpacity
                key={c}
                style={[
                  styles.colorDot,
                  {
                    backgroundColor: c,
                    transform: [{ scale: c === color ? 1.2 : 1 }],
                  },
                  c === color ? { borderWidth: 2, borderColor: "#000" } : {},
                ]}
                onPress={() => setColor(c)}
              />
            ))}
          </View>
        </View>

        {/* Project Type */}
        <View style={styles.card}>
          <Text style={styles.label}>Type of Project</Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-around",
              marginTop: spacing.sm,
            }}
          >
            {typeOptions.map((t) => (
              <TouchableOpacity
                key={t}
                style={[
                  {
                    paddingVertical: 6,
                    paddingHorizontal: 12,
                    borderRadius: 8,
                    borderWidth: 1,
                    borderColor: t === type ? colors.primary : "#ddd",
                    backgroundColor: t === type ? colors.primary : "#fff",
                  },
                ]}
                onPress={() => setType(t)}
              >
                <Text
                  style={{ color: t === type ? "#fff" : colors.textPrimary }}
                >
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity
          onPress={saveProject}
          activeOpacity={0.8}
          disabled={saving || loadingProject}
        >
          <View
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.saveButtonText}>
              {saving
                ? "Saving..."
                : isEditing
                  ? "Save Changes"
                  : "Save Project"}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  card: {
    backgroundColor: "#fff",
    marginTop: 13,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  label: {
    fontWeight: "600",
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: "#f9f9f9",
    borderRadius: 8,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9f9f9",
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  colorRow: {
    flexDirection: "row",
    marginTop: spacing.sm,
  },
  colorDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  saveButton: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: "center",
    marginTop: spacing.lg,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
    elevation: 4,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
