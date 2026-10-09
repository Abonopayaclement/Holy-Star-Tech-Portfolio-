import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { User, Mail, Lock, Phone, UserCheck, Eye, EyeOff } from 'lucide-react-native';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const router = useRouter();

  const handleRegister = async () => {
    if (!fullName.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        password,
      });
      router.replace('/(customer)/home');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, SPACING.lg),
            paddingBottom: Math.max(insets.bottom, SPACING.lg),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Join QueueLess</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Register as a customer to skip waiting in lines and manage your queue appointments.
          </Text>
        </View>

        {error && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Full Name *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <User color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="e.g. Ama Mensah"
                placeholderTextColor={colors.textMuted}
                value={fullName}
                onChangeText={setFullName}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Mail color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="ama@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Phone Number (Optional)</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Phone color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="+233 50 123 4567"
                placeholderTextColor={colors.textMuted}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Password (Min 6 chars) *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Lock color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff color={colors.textMuted} size={18} />
                ) : (
                  <Eye color={colors.textMuted} size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Confirm Password *</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Lock color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="••••••••"
                placeholderTextColor={colors.textMuted}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? (
                  <EyeOff color={colors.textMuted} size={18} />
                ) : (
                  <Eye color={colors.textMuted} size={18} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleRegister}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Create Customer Account</Text>
                <UserCheck color="#ffffff" size={18} style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Already have an account?</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.loginText, { color: colors.primary }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '600',
  },
  form: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.md,
  },
  label: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: SPACING.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
  },
  inputIcon: {
    marginRight: SPACING.sm,
  },
  input: {
    flex: 1,
    height: 48,
    color: COLORS.text,
    fontSize: 15,
  },
  eyeButton: {
    padding: 8,
    marginRight: -4,
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.sm,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: SPACING.xl,
    gap: 6,
  },
  footerText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  loginText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
