import { useSidebar } from "@/src/context/SidebarContext";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../theme/theme";

type Props = {
  title: string;
  // showBackButton remains for backward compatibility but is optional and ignored when navigation.canGoBack() is available
  showBackButton?: boolean;
};

export default function TopBar({ title, showBackButton = false }: Props) {


  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      {/* Left: always menu */}
      <TouchableOpacity onPress={toggleSidebar} style={styles.iconBtn}>
        <Ionicons name="menu" size={26} color={colors.primary} />
      </TouchableOpacity>

      {/* Title */}
      <Text style={styles.title}>{title}</Text>

      {/* Right: back button when we can go back; otherwise render an empty spacer */}
      {(typeof (navigation as any).canGoBack === 'function' && (navigation as any).canGoBack()) || showBackButton ? (
        <TouchableOpacity
          onPress={() => {
            if ((navigation as any).canGoBack()) {
              (navigation as any).goBack();
            } else {
              router.push("/");
            }
          }}
          style={styles.iconBtn}
        >
          <Ionicons name="arrow-back" size={26} color={colors.primary} />
        </TouchableOpacity>
      ) : (
        <View style={styles.iconBtn} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    marginTop: 25,
    zIndex: 10,
  },
  iconBtn: { padding: spacing.xs },
  title: { fontSize: 20, fontWeight: "700", color: colors.primary },
  avatar: { width: 30, height: 30, borderRadius: 15 },
});
