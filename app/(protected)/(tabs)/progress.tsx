import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutAnimation,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";

import TopBar from "@/src/components/TopBar";
import { supabase } from "@/src/lib/supabase";
import { colors, spacing } from "@/src/theme/theme";
import { useFocusEffect } from "@react-navigation/native"; // added for screen refetch

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const STATUSES = ["draft", "pending", "completed", "not_started"] as const;

export default function ProjectsScreen() {
  const router = useRouter();
  const [showNoProjectsModal, setShowNoProjectsModal] = useState(false);
  // Sidebar toggling is handled inside TopBar component
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    draft: true,
    pending: true,
    completed: false,
    not_started: false,
  });

  const isFetchingRef = useRef(false);
  const lastFetchedRef = useRef(0);
  const fetchProjects = useCallback(async () => {
    const now = Date.now();
    if (isFetchingRef.current || now - lastFetchedRef.current < 2000) return;
    try {
      isFetchingRef.current = true;
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("due_date", { ascending: true });
      if (error) throw error;
      const next = data || [];
      setProjects((prev) =>
        JSON.stringify(prev) === JSON.stringify(next) ? prev : next,
      );
    } catch (err: any) {
      console.log("Fetch error:", err);
      Alert.alert("Error", err?.message || "Failed to fetch projects");
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      lastFetchedRef.current = Date.now();
    }
  }, []);

  // Fetch when screen refocuses
  useFocusEffect(
    useCallback(() => {
      fetchProjects();
    }, [fetchProjects]),
  );

  // Handle no-projects modal
  useEffect(() => {
    if (!loading) {
      const allEmpty = STATUSES.every(
        (status) =>
          projects.filter((p) => (p.status ?? "draft") === status).length === 0,
      );
      setShowNoProjectsModal(allEmpty);
    }
  }, [projects, loading]);

  const toggleSection = (status: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSections((prev) => ({ ...prev, [status]: !prev[status] }));
  };

  const deleteProject = async (id: string) => {
    Alert.alert(
      "Confirm Delete",
      "Are you sure you want to delete this project?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("projects")
                .delete()
                .eq("id", id);
              if (error) throw error;
              setProjects(projects.filter((p) => p.id !== id));
            } catch (err: any) {
              Alert.alert("Error", err?.message || "Failed to delete project");
            }
          },
        },
      ],
    );
  };

  const changeStatus = async (id: string, currentStatus: string) => {
    const options = STATUSES.filter((s) => s !== currentStatus);
    Alert.alert("Move project to…", undefined, [
      ...options.map((s) => ({
        text: s
          .replace("_", " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase()),
        onPress: async () => {
          try {
            const { error } = await supabase
              .from("projects")
              .update({ status: s })
              .eq("id", id);
            if (error) throw error;
            setProjects((prev) =>
              prev.map((p) => (p.id === id ? { ...p, status: s } : p)),
            );
          } catch (err: any) {
            Alert.alert(
              "Error",
              err?.message || "Failed to update project status",
            );
          }
        },
      })),
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const STATUS_LABEL: Record<string, string> = {
    draft: "Draft",
    pending: "In Progress",
    completed: "Completed",
    not_started: "Not Started",
  };

  const STATUS_COLOR: Record<string, string> = {
    draft: "#9CA3AF",
    pending: "#F97316",
    completed: "#22C55E",
    not_started: "#6B7280",
  };

  const renderProject = (item: any) => {
    const status = item.status ?? "draft";
    return (
      <View
        style={[styles.card, { borderLeftColor: item.color || colors.primary }]}
      >
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() =>
            router.push({
              pathname: "/(protected)/projects/[id]",
              params: { id: item.id },
            })
          }
          activeOpacity={0.8}
        >
          <Text style={styles.title}>{item.title}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(protected)/addProjects",
                  params: { projectId: item.id },
                })
              }
              style={{ marginRight: spacing.sm }}
            >
              <Ionicons
                name="create-outline"
                size={22}
                color={colors.primary}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => deleteProject(item.id)}>
              <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>

        {!!item.desc && <Text style={styles.desc}>{item.desc}</Text>}

        <View style={styles.infoRow}>
          <TouchableOpacity
            style={[
              styles.typeBadge,
              { backgroundColor: STATUS_COLOR[status] },
            ]}
            onPress={() => changeStatus(item.id, status)}
          >
            <Text style={styles.typeText}>
              {STATUS_LABEL[status]} · tap to change
            </Text>
          </TouchableOpacity>

          {item.due_date && (
            <View style={styles.deadlineRow}>
              <Ionicons name="calendar-outline" size={14} color="#666" />
              <Text style={styles.deadlineText}>
                {new Date(item.due_date).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Projects" />

      <FlatList
        contentContainerStyle={{ padding: spacing.md }}
        data={STATUSES}
        keyExtractor={(status) => status}
        renderItem={({ item: status }) => {
          const filtered = projects.filter(
            (p) => (p.status ?? "draft") === status,
          );
          return (
            <View style={styles.section}>
              <TouchableOpacity
                style={styles.sectionHeader}
                onPress={() => toggleSection(status)}
              >
                <Text style={styles.sectionTitle}>
                  {status
                    .replace("_", " ")
                    .replace(/\b\w/g, (c: string) => c.toUpperCase())}{" "}
                  ({filtered.length})
                </Text>
                <Ionicons
                  name={openSections[status] ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.textSecondary}
                />
              </TouchableOpacity>

              {openSections[status] && (
                <View style={styles.sectionContent}>
                  {filtered.length > 0 ? (
                    filtered.map((p) => (
                      <View key={p.id}>{renderProject(p)}</View>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No projects</Text>
                  )}
                </View>
              )}
            </View>
          );
        }}
      />
      <Modal
        visible={showNoProjectsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNoProjectsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>No Projects Found</Text>
            <Text style={styles.modalText}>
              You don&apos;t have any projects yet. Start by creating a new
              project!
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setShowNoProjectsModal(false);
                router.push("/(protected)/addProjects");
              }}
            >
              <Text style={styles.modalButtonText}>Create Project</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => router.push("/(protected)/addProjects")}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: spacing.lg,
    borderRadius: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: spacing.md,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  sectionContent: {
    padding: spacing.sm,
  },
  card: {
    backgroundColor: "#fafafa",
    padding: spacing.md,
    borderRadius: 10,
    marginBottom: spacing.sm,
    borderLeftWidth: 5,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  desc: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  typeBadge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  typeText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 12,
  },
  deadlineRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  deadlineText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#666",
  },
  emptyText: {
    textAlign: "center",
    color: colors.textSecondary,
    padding: spacing.md,
  },
  startButton: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  startButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    width: 300,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  modalText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: "center",
  },
  modalButton: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 15,
  },
  addButton: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.xl * 2,
    backgroundColor: colors.primary,
    borderRadius: 32,
    width: 56,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
