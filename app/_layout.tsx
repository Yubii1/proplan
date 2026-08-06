// app/_layout.tsx
import { AuthProvider } from "@/src/context/Authprovider";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { Alert } from "react-native";
import { PaperProvider } from "react-native-paper";

// 🔔 Configure how notifications behave when received
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export default function RootLayout() {
  useEffect(() => {
    registerForPushNotificationsAsync();
  }, []);

  return (
    <PaperProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthProvider>
    </PaperProvider>
  );
}

async function registerForPushNotificationsAsync() {
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      Alert.alert(
        "Notifications disabled",
        "Failed to get push token for push notifications!",
      );
      return;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("📱 Expo Push Token:", token);

    // 👉 Save `token` to your backend (Supabase) here
    return token;
  } else {
    console.warn("Push notifications require a physical device.");
  }
}
