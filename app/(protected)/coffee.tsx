import TopBar from "@/src/components/TopBar";
import { colors, spacing } from "@/src/theme/theme";
import { Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Set this once you have a real Buy Me a Coffee / Ko-fi / PayPal.me link.
// Left blank on purpose rather than pointing somewhere fake.
const COFFEE_URL = "";

export default function CoffeeScreen() {
  const handlePress = () => {
    if (!COFFEE_URL) {
      Alert.alert(
        "Not set up yet",
        "Add your Buy Me a Coffee / Ko-fi link to COFFEE_URL in app/(protected)/coffee.tsx",
      );
      return;
    }
    Linking.openURL(COFFEE_URL);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <TopBar title="Buy Creator Coffee" showBackButton />
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconWrap}>
          <Ionicons name="cafe-outline" size={32} color="#B45309" />
        </View>
        <Text style={styles.title}>Enjoying ProPlan?</Text>
        <Text style={styles.lede}>
          If this app has been useful for keeping your projects on track, you
          can support its development with a coffee. Totally optional — just a
          nice way to say thanks.
        </Text>

        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Ionicons name="cafe" size={18} color="#fff" />
          <Text style={styles.buttonText}>Buy a coffee</Text>
        </TouchableOpacity>

        {!COFFEE_URL && (
          <Text style={styles.hint}>
            (Link not configured yet — this button currently shows a placeholder
            message.)
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.lg, alignItems: "center" },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "#FFF7ED",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  lede: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    backgroundColor: "#B45309",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 100,
  },
  buttonText: { color: "#fff", fontWeight: "700", fontSize: 15 },
  hint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: "center",
  },
});
