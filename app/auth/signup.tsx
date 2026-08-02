// app/auth/signup.tsx
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { supabase } from '../../src/lib/supabase';
import { colors, spacing } from '../../src/theme/theme';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!email || !fullName || !username || !password) {
      Alert.alert('Error', 'All fields are required.');
      return;
    }

    // (1) Username availability — do this BEFORE creating auth user
    setLoading(true);
    try {
      const { data: isFree, error: availError } = await supabase
        .rpc('is_username_available', { p_username: username });

      if (availError) {
        Alert.alert('Error', availError.message);
        return;
      }
      if (!isFree) {
        Alert.alert('Username taken', 'Please choose another username.');
        return;
      }

      // (2) Create auth user — this sends verification email (per your Auth settings)
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) {
        Alert.alert('Signup Error', signUpError.message);
        return;
      }

      const user = authData.user;
      if (!user) {
        // In most email-confirm setups, user exists but session is null.
        Alert.alert('Check your email', 'We sent you a verification link.');
        return;
      }

      // (3) Create profile via RPC (bypasses RLS, validates auth.users + username)
      const { error: profileError } = await supabase.rpc('create_profile_for_user', {
        p_user_id: user.id,
        p_full_name: fullName,
        p_username: username,
        p_avatar_url: null,
      });

      if (profileError) {
        if (profileError.code === '23505') {
          Alert.alert('Username taken', 'Please choose another username.');
          return;
        }
        Alert.alert('Profile Error', profileError.message);
        return;
      }

      // (4) Inform & redirect
      Alert.alert(
        'Verify your email',
        'A verification link has been sent to your email. Please verify before logging in.'
      );

      setEmail('');
      setFullName('');
      setUsername('');
      setPassword('');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Sign Up</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <TextInput
            placeholder="Full Name"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={fullName}
            onChangeText={setFullName}
          />

          <TextInput
            placeholder="Username"
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <View style={styles.passwordContainer}>
            <TextInput
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              style={styles.passwordInput}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <Ionicons
                name={showPassword ? 'eye-off' : 'eye'}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account…' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/auth/login')}>
            <Text style={styles.link}>Already have an account? Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.primary,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  input: {
    backgroundColor: colors.white,
    borderColor: colors.textSecondary,
    borderWidth: 1,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.md,
    color: colors.textPrimary, // ensure visible text
    fontSize: 16,
  },
  button: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  buttonText: {
    color: colors.white,
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: colors.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    fontSize: 15,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderColor: colors.textSecondary,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    height: 51,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: colors.textPrimary,
  },
});
