// app/_layout.tsx
import { AuthProvider } from "@/src/context/Authprovider";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";

//  Configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    registerForLocalNotificationsAsync();
  }, []);

  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}

// Requests permission for LOCAL notifications only (what Calendar's "Set Alarm"
// uses via scheduleNotificationAsync). Deliberately does NOT call
// getExpoPushTokenAsync() — that's for REMOTE push and requires the project to
// be linked to an EAS project ID (`eas init`), plus a backend to store tokens.
// Neither exists yet, and calling it without a projectId crashes with:
// "No projectId found". Add that back in once remote push is actually built.
async function registerForLocalNotificationsAsync() {
  if (!Device.isDevice) {
    Alert.alert(
      "Physical device required",
      "Notifications only work on a real device.",
    );
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== "granted") {
    Alert.alert(
      "Notifications disabled",
      "Enable notifications to get project deadline reminders.",
    );
  }
}
