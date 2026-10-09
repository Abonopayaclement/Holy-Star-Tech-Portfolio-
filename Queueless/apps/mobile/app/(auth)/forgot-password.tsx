import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleReset = () => {
    if (!email.trim()) return;
    setLoading(true);
    // Simulate recovery dispatch
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1000);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 20) }]}>
      <View style={styles.content}>
        {submitted ? (
          <View style={styles.successCard}>
            <CheckCircle2 color={COLORS.success} size={48} style={{ marginBottom: 16 }} />
            <Text style={styles.title}>Check Your Email</Text>
            <Text style={styles.subtitle}>
              We have sent password recovery instructions to {email}.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text style={styles.primaryButtonText}>Return to Sign In</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.formCard}>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your customer email and we will send you a link to reset your password.
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={styles.inputWrapper}>
                <Mail color={COLORS.textMuted} size={18} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="customer@example.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (!email.trim() || loading) && styles.buttonDisabled]}
              onPress={handleReset}
              disabled={!email.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft color={COLORS.textSecondary} size={16} style={{ marginRight: 6 }} />
              <Text style={styles.backText}>Back to Sign In</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    padding: SPACING.lg,
  },
  content: {
    maxWidth: 400,
    width: '100%',
    alignSelf: 'center',
  },
  formCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  successCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    textAlign: 'center',
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  inputGroup: {
    marginBottom: SPACING.lg,
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
  primaryButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    minHeight: 44,
    paddingVertical: 8,
  },
  backText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '600',
  },
});
