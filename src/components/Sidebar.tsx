// src/components/Sidebar.tsx
import { useAuth } from '@/src/context/Authprovider';
import { getUserLogo } from '@/src/utils/getUserLogo';
import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useState } from 'react';
import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Svg, { Defs, Stop, LinearGradient as SvgLinearGradient, Text as SvgText } from 'react-native-svg';
import { colors, spacing } from '../theme/theme';

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (screen: string) => void;
};

export default function Sidebar({ isOpen, onClose, onNavigate }: SidebarProps) {
  // Animated slide
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: withTiming(isOpen ? 0 : -260, { duration: 300 }) }],
  }));

  const { session, profile } = useAuth();
  const userId = session?.user?.id;

  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  // Fetch user logo safely, only when userId changes
  useEffect(() => {
    let mounted = true;

    const fetchLogo = async () => {
      if (!userId) return;
      try {
        const url = await getUserLogo(userId);
        if (mounted) setLogoUrl(url);
      } catch (e) {
        console.warn('Failed to load user logo', e);
      }
    };

    fetchLogo();

    return () => {
      mounted = false;
    };
  }, [userId]); // Removed isOpen from dependencies

 const displayName = profile?.username || profile?.full_name || 'User';
const defaultAvatar = require('../../assets/images/social.png');

  // Memoize navigation handlers to prevent unnecessary renders
  const handleNavigate = useCallback(
    (screen: string) => {
      onNavigate(screen);
      onClose();
    },
    [onNavigate, onClose]
  );

return (
  <Animated.View style={[styles.sidebar, animatedStyle]}>
    <View style={{ flex: 1 }}>
      {/* Scrollable content */}
      <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
        {/* Header with gradient title (left) and close (right) */}
        <View style={styles.header}>
          <Svg height={28} width={160}>
            <Defs>
              <SvgLinearGradient id="proplanGradient" x1="0" y1="0" x2="1" y2="0">
                <Stop offset="0%" stopColor={colors.primary} />
                <Stop offset="100%" stopColor="#000" />
              </SvgLinearGradient>
            </Defs>
            <SvgText x="0" y="22" fill="url(#proplanGradient)" fontSize="24" fontWeight="800">
              ProPlan
            </SvgText>
          </Svg>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="close" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* User Section */}
        <View style={styles.userSection}>
          <Image
            source={logoUrl ? { uri: logoUrl } : profile?.logo_url ? { uri: profile.logo_url } : defaultAvatar}
            style={styles.avatar}
          />
          <Text style={styles.welcomeLine}>
            Welcome <Text style={styles.userName}>{displayName}</Text>
          </Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Menu Items */}
        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/(tabs)')}>
          <Text style={styles.menuText}>🏠 Go to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/(tabs)/progress')}>
          <Text style={styles.menuText}>📂 View All Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/settings')}>
          <Text style={styles.menuText}>⚙️ Customize Settings</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/creator')}>
          <Text style={styles.menuText}>ℹ️ Creator Information</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/bug')}>
          <Text style={styles.menuText}>🐞 Report a Bug</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={() => handleNavigate('(protected)/coffee')}>
          <Text style={styles.menuText}>☕ Buy Creator Coffee</Text>
        </TouchableOpacity>
      </ScrollView>

     
      <TouchableOpacity style={[styles.menuItem, styles.logout]} onPress={() => handleNavigate('logout')}>
        <Text style={[styles.menuText, styles.logoutText]}>🛑 Logout</Text>
      </TouchableOpacity>
    </View>
  </Animated.View>
);
}

const styles = StyleSheet.create({
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 260,
    height: '100%',
    backgroundColor: '#fff',
    padding: spacing.md,
    borderRightWidth: 1,
    borderRightColor: '#eee',
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 2, height: 0 },
    shadowRadius: 6,
  },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 24, marginBottom: spacing.lg },
  backBtn: { padding: 6 },
  appTitle: { fontSize: 24, fontWeight: '800' },
  avatar: { 
  width: 64, 
  height: 64, 
  borderRadius: 32, 
  backgroundColor: '#eee',
  marginBottom: 8,          // space below avatar
},
welcomeLine: {
  fontSize: 15,
  color: '#666',
},
userName: {
  fontSize: 14,
  fontWeight: '700',
  color: '#111',
},
  divider: { height: 1, backgroundColor: '#f0f0f0', marginVertical: spacing.sm },
  menuItem: { paddingVertical: spacing.sm * 2.2, borderBottomWidth: 1, borderBottomColor: '#f7f7f7' },
  menuText: { fontSize: 16 },
  logout: { marginTop: spacing.lg, borderTopWidth: 1, borderTopColor: '#eee' },
  logoutText: { color: '#d33', fontWeight: '700' , marginTop:"auto", },
  userSection: {
  alignItems: 'center',     // center everything horizontally
  marginVertical: spacing.md,
},
});
