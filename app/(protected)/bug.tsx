import TopBar from "@/src/components/TopBar";
import { useAuth } from "@/src/context/Authprovider";
import { colors, spacing } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

const BUG_EMAIL = "ubongoffiong526@gmail.com";

export default function BugScreen() {
  const { session } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    if (!title.trim() || !description.trim()) {
      Alert.alert(
        "Missing info",
        "Add a short title and a description of what happened.",
      );
      return;
    }

    const subject = encodeURIComponent(`[ProPlan bug] ${title}`);
    const body = encodeURIComponent(
      `${description}\n\n---\nReported by: ${session?.user?.email ?? "unknown"}`,
    );
    const url = `mailto:${BUG_EMAIL}?subject=${subject}&body=${body}`;

    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      Linking.openURL(url);
    } else {
      Alert.alert(
        "No email app found",
        `Send this to ${BUG_EMAIL} directly instead.`,
      );
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Report a Bug" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="bug-outline" size={28} color={colors.primary} />
        </View>
        <Text style={styles.lede}>
          Found something broken? Describe it below — this opens your email app
          with the details pre-filled, no account or ticket system needed.
        </Text>

        <Text style={styles.label}>What happened?</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g. Calendar doesn't show deadlines"
          placeholderTextColor="#999"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Details</Text>
        <TextInput
          style={[styles.input, styles.textarea]}
          placeholder="What did you expect vs. what actually happened? Steps to reproduce help a lot."
          placeholderTextColor="#999"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={5}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Send report</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#eee",
  },
  lede: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: spacing.md,
    fontSize: 15,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  textarea: { height: 120, textAlignVertical: "top" },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
