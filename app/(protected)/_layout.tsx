import Sidebar from "@/src/components/Sidebar";
import { useAuth } from "@/src/context/Authprovider";
import { SidebarProvider, useSidebar } from "@/src/context/SidebarContext";
import { supabase } from "@/src/lib/supabase";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

function ProtectedLayoutContent() {
  const { session, loading } = useAuth();
  const router = useRouter();
  const { isOpen, closeSidebar } = useSidebar();

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/auth/login");
    }
  }, [loading, session, router]);

  if (loading || !session) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const handleNavigate = (screen: string) => {
    if (screen === "logout") {
      // Sign out for real instead of routing to a page that doesn't exist.
      // AuthProvider's onAuthStateChange listener flips `session` to null,
      // and the effect above redirects to /auth/login automatically.
      supabase.auth.signOut();
      return;
    }
    router.push(`/${screen}` as any);
  };

  return (
    <>
      <Sidebar
        isOpen={isOpen}
        onClose={closeSidebar}
        onNavigate={handleNavigate}
      />
      {isOpen && (
        <Pressable
          onPress={closeSidebar}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.2)",
            zIndex: 4,
          }}
        />
      )}
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function ProtectedLayout() {
  return (
    <SidebarProvider>
      <ProtectedLayoutContent />
    </SidebarProvider>
  );
}
