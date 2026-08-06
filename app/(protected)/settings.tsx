import DropdownButton from '@/src/components/Dropdownbutton';
import TopBar from '@/src/components/TopBar';
import { useAuth } from '@/src/context/Authprovider';
import { supabase } from '@/src/lib/supabase';
import { uploadUserLogo } from '@/src/utils/uploadUserLogo';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function SettingsScreen() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const email = session?.user?.email || '';
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const [localUri, setLocalUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Dropdown sections
  const [showPersonalInfo, setShowPersonalInfo] = useState(false);
  const [showAlarms, setShowAlarms] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Password change state
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);

  // Fetch profile
  useEffect(() => {
    if (!userId) return;

    const fetchProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, username, avatar_url')
        .eq('id', userId)
        .single();

      if (error) {
        console.error(error);
        Alert.alert('Error', 'Failed to load profile');
      } else if (data) {
        setFullName(data.full_name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || null);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [userId]);

  // Pick image
  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission required', 'Permission to access photos is required!');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets.length > 0) {
      setLocalUri(result.assets[0].uri);
    }
  };

  // Upload avatar
  const handleUpload = async () => {
    if (!localUri || !userId) {
      Alert.alert('Error', 'No image selected or not logged in');
      return;
    }
    try {
      setUploading(true);
      const publicUrl = await uploadUserLogo(userId, localUri);
      setAvatarUrl(publicUrl);

      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Success', 'Profile picture updated!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Upload failed', err?.message || String(err));
    } finally {
      setUploading(false);
    }
  };

  // Save profile
  const handleSave = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);

      if (error) throw error;
      Alert.alert('Success', 'Profile updated!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Update failed', err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  // Change password
  const handleChangePassword = async () => {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }
    try {
      setChangingPassword(true);
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      Alert.alert('Success', 'Password changed successfully!');
      setNewPassword('');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Password change failed', err?.message || String(err));
    } finally {
      setChangingPassword(false);
    }
  };

  // Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0366d6" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar title="Settings" showBackButton />

      <ScrollView contentContainerStyle={{ padding: 16 }}>

  {/* Profile Avatar + Change Photo */}
  <View style={styles.avatarContainer}>
    <Image
      source={
        localUri
          ? { uri: localUri }
          : avatarUrl
          ? { uri: avatarUrl }
          : require('../../assets/images/social.png')
      }
      style={styles.avatar}
    />
    <TouchableOpacity style={styles.btnSecondary} onPress={pickImage}>
      <Text style={[styles.btnText, { color: '#0366d6' }]}>Change Photo</Text>
    </TouchableOpacity>
    {localUri && (
      <TouchableOpacity
        style={[styles.btnPrimary, { marginTop: 10 }]}
        onPress={handleUpload}
        disabled={uploading}
      >
        {uploading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Photo</Text>}
      </TouchableOpacity>
    )}
  </View>

  {/* Change Personal Information */}
  <DropdownButton
    title="Change Personal Information"
    expanded={showPersonalInfo}
    onPress={() => setShowPersonalInfo(!showPersonalInfo)}
  >
    <View style={styles.card}>
      {/* Inputs: Full Name, Username, Email */}
      <Text style={styles.label}>Full Name</Text>
      <TextInput
        style={styles.input}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Enter your full name"
      />
      <Text style={styles.label}>Username</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#f1f1f1' }]}
        value={username}
        editable={false}
      />
      <Text style={styles.hint}>*This can’t be changed*</Text>
      <Text style={styles.label}>Email</Text>
      <TextInput
        style={[styles.input, { backgroundColor: '#f1f1f1' }]}
        value={email}
        editable={false}
      />
      <TouchableOpacity style={styles.btnPrimary} onPress={handleSave}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Save Changes</Text>}
      </TouchableOpacity>
    </View>
  </DropdownButton>

  {/* Manage Project Alarms */}
  <DropdownButton
    title="Manage Project Alarms"
    expanded={showAlarms}
    onPress={() => setShowAlarms(!showAlarms)}
  >
    <View style={styles.card}>
      <Text style={styles.label}>
        Control how and when you receive project-related alarms.
      </Text>
    </View>
  </DropdownButton>

  {/* Push Notifications */}
  <DropdownButton
    title="Push Notifications"
    expanded={showNotifications}
    onPress={() => setShowNotifications(!showNotifications)}
  >
    <View style={styles.card}>
      <Text style={styles.label}>
        Enable or disable push notifications for updates and alerts.
      </Text>
    </View>
  </DropdownButton>

  {/* Change Password */}
  <DropdownButton
    title="Change Password"
    expanded={showPassword}
    onPress={() => setShowPassword(!showPassword)}
  >
    <View style={styles.card}>
      <Text style={styles.label}>New Password</Text>
      <View style={styles.passwordContainer}>
        <TextInput
          style={[styles.input, { flex: 1, color: '#333' }]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
          placeholderTextColor="#999"
          secureTextEntry={!showPasswordText}
        />
        <TouchableOpacity
          onPress={() => setShowPasswordText(!showPasswordText)}
          style={styles.eyeButton}
        >
          <Text style={{ fontSize: 16 }}>{showPasswordText ? '🙈' : '👁️'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={styles.btnPrimary}
        onPress={handleChangePassword}
        disabled={changingPassword}
      >
        {changingPassword ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Change Password</Text>}
      </TouchableOpacity>
    </View>
  </DropdownButton>

  {/* Logout */}
  <TouchableOpacity
    style={[styles.btnSecondary, { marginTop: 20 }]}
    onPress={handleLogout}
  >
    <Text style={[styles.btnText, { color: '#e63946' }]}>Logout</Text>
  </TouchableOpacity>

</ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatarContainer: { alignItems: 'center', marginVertical: 20 },
  avatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#eee' },
  card: {
    backgroundColor: '#fafafa',
    padding: 16,
    borderRadius: 12,
    marginVertical: 10,
    elevation: 2,
  },
  label: { fontSize: 14, color: '#333', marginBottom: 6, fontWeight: '600' },
  hint: { fontSize: 12, color: '#888', marginBottom: 12, fontStyle: 'italic' },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
    color: '#000',
  },
  btnPrimary: {
    backgroundColor: '#0366d6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnSecondary: {
    backgroundColor: '#e9ecef',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontWeight: '700' },
  dropdownHeader: {
    backgroundColor: '#f5f5f5',
    padding: 14,
    borderRadius: 8,
    marginTop: 10,
  },
  dropdownTitle: { fontSize: 16, fontWeight: '600', color: '#333' },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eyeButton: {
    paddingHorizontal: 8,
  },
});
