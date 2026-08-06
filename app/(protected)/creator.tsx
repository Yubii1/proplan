import TopBar from "@/src/components/TopBar";
import { colors, spacing } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const LINKS = [
  {
    icon: "logo-github" as const,
    label: "GitHub",
    url: "https://github.com/Yubii1",
  },
  {
    icon: "logo-linkedin" as const,
    label: "LinkedIn",
    url: "https://www.linkedin.com/in/ubongabasi-unwana-offiong-5125b4321/",
  },
  {
    icon: "mail-outline" as const,
    label: "Email",
    url: "mailto:ubongoffiong526@gmail.com",
  },
];

export default function CreatorScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Creator" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>UB</Text>
        </View>
        <Text style={styles.name}>UbongAbasi Unwana Offiong</Text>
        <Text style={styles.role}>Mobile App Developer</Text>

        <View style={styles.card}>
          <Text style={styles.bio}>
            React Native &amp; Flutter developer with a background in networking
            and cybersecurity. ProPlan started as a way to actually track my own
            projects — from idea to shipped — instead of losing track of them
            across notes apps.
          </Text>
        </View>

        <Text style={styles.sectionLabel}>Get in touch</Text>
        <View style={styles.card}>
          {LINKS.map((link, i) => (
            <TouchableOpacity
              key={link.label}
              style={[
                styles.linkRow,
                i === LINKS.length - 1 && { borderBottomWidth: 0 },
              ]}
              onPress={() => Linking.openURL(link.url)}
            >
              <Ionicons name={link.icon} size={20} color={colors.primary} />
              <Text style={styles.linkText}>{link.label}</Text>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  avatarText: { color: "#fff", fontSize: 24, fontWeight: "800" },
  name: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    textAlign: "center",
  },
  role: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },
  sectionLabel: {
    alignSelf: "flex-start",
    fontSize: 13,
    fontWeight: "700",
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: spacing.md,
    width: "100%",
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: "#eee",
  },
  bio: { fontSize: 14, color: colors.textPrimary, lineHeight: 21 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  linkText: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: "500",
  },
});
