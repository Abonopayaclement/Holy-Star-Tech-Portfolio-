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
import { Mail, Lock, LogIn, ArrowRight, ShieldCheck, Eye, EyeOff } from 'lucide-react-native';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Please enter both your email address and password.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      router.replace('/(customer)/home');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleFastDemoLogin = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
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
        {/* Header Branding */}
        <View style={styles.header}>
          <View style={[styles.logoBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>Q</Text>
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Welcome to QueueLess</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Sign in to track queues and book appointments</Text>
        </View>

        {/* Error Notification */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
          </View>
        )}

        {/* Form Inputs */}
        <View style={[styles.form, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Email Address</Text>
            <View style={[styles.inputWrapper, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Mail color={colors.textMuted} size={18} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="customer@example.com"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.passwordHeader}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Password</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
                <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
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

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <View style={styles.buttonContent}>
                <Text style={styles.primaryButtonText}>Sign In</Text>
                <LogIn color="#ffffff" size={18} style={{ marginLeft: 8 }} />
              </View>
            )}
          </TouchableOpacity>

          {/* Demo Login Shortcuts */}
          <View style={[styles.demoSection, { borderTopColor: colors.surfaceBorder }]}>
            <Text style={[styles.demoLabel, { color: colors.textMuted }]}>Fast Fill Demo Accounts:</Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
                onPress={() => handleFastDemoLogin('customer@apexbank.com')}
              >
                <ShieldCheck color={colors.primary} size={14} />
                <Text style={[styles.demoChipText, { color: colors.textSecondary }]}>Customer 1</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoChip, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
                onPress={() => handleFastDemoLogin('kwame.mensah@gmail.com')}
              >
                <ShieldCheck color={colors.primary} size={14} />
                <Text style={[styles.demoChipText, { color: colors.textSecondary }]}>Kwame (VIP)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>Don't have an account?</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <View style={styles.registerLink}>
              <Text style={[styles.registerText, { color: colors.primary }]}>Sign Up as Customer</Text>
              <ArrowRight color={colors.primary} size={16} style={{ marginLeft: 4 }} />
            </View>
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
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: RADIUS.lg,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 30,
    fontWeight: '900',
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
    textAlign: 'center',
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
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
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  forgotText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
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
  demoSection: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopColor: COLORS.surfaceBorder,
    borderTopWidth: 1,
  },
  demoLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  demoRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
  },
  demoChipText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '600',
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
  registerLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  registerText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
});
