import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/context/ThemeContext';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { ScreenWrapper, MobileHeader } from '../../src/components';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Check,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react-native';

export default function EditProfileScreen() {
  const { user, updateProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [dob, setDob] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const formatDob = (dobValue?: string | Date | null): string => {
    if (!dobValue) return '';
    try {
      const d = new Date(dobValue);
      if (isNaN(d.getTime())) return '';
      const day = String(d.getUTCDate()).padStart(2, '0');
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const year = d.getUTCFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return '';
    }
  };

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setEmail(user.email || '');
      setPhoneNumber(user.phoneNumber || '');
      setDob(formatDob(user.dob));
    }
  }, [user]);

  const handleSave = async () => {
    if (!fullName.trim()) {
      setFeedback({ type: 'error', message: 'Full name is required.' });
      return;
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setFeedback({ type: 'error', message: 'Please enter a valid email address.' });
      return;
    }

    if (dob.trim()) {
      const ddmmyyyy = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/.exec(dob.trim());
      if (!ddmmyyyy) {
        setFeedback({
          type: 'error',
          message: 'Date of birth must be in DD/MM/YYYY format (e.g. 15/08/1995).',
        });
        return;
      }
      const day = parseInt(ddmmyyyy[1], 10);
      const month = parseInt(ddmmyyyy[2], 10);
      const year = parseInt(ddmmyyyy[3], 10);
      if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900 || year > new Date().getFullYear()) {
        setFeedback({ type: 'error', message: 'Please enter a realistic date of birth.' });
        return;
      }
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        dob: dob.trim() || undefined,
      });
      setFeedback({ type: 'success', message: 'Profile updated successfully!' });
      setTimeout(() => {
        router.back();
      }, 1200);
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.response?.data?.error || err.message || 'Failed to update profile details.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <MobileHeader
        title="Personal Profile"
        subtitle="Manage your identity and contact information"
        onBack={() => router.back()}
      />

      <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
        <View style={styles.content}>
          {/* Avatar Banner */}
          <View style={[styles.avatarCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'C'}</Text>
            </View>
            <Text style={[styles.userName, { color: colors.text }]}>{user?.fullName || 'Customer'}</Text>
            <View style={[styles.verifiedBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <ShieldCheck color={colors.success} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.verifiedText, { color: colors.success }]}>Verified Account</Text>
            </View>
          </View>

          {/* Feedback Banner */}
          {feedback && (
            <View
              style={[
                styles.feedbackCard,
                feedback.type === 'success'
                  ? { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5', borderColor: colors.success }
                  : { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.15)' : '#FEF2F2', borderColor: colors.danger },
              ]}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 color={colors.success} size={18} style={{ marginRight: 8 }} />
              ) : (
                <AlertCircle color={colors.danger} size={18} style={{ marginRight: 8 }} />
              )}
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? colors.success : colors.danger },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Form Fields */}
          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {/* Full Name */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Full Name *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                <User color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Email Address */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Email Address *</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                <Mail color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            {/* Phone Number */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Phone Number</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                <Phone color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+233 24 123 4567"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Date of Birth */}
            <View style={styles.fieldGroup}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Date of Birth (DD/MM/YYYY)</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                <Calendar color={colors.textMuted} size={18} style={{ marginRight: 10 }} />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  value={dob}
                  onChangeText={setDob}
                  placeholder="DD/MM/YYYY (e.g. 15/08/1995)"
                  placeholderTextColor={colors.textMuted}
                />
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.cancelBtn, { borderColor: colors.surfaceBorder }]}
                onPress={() => router.back()}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={handleSave}
                disabled={isSaving}
                activeOpacity={0.8}
              >
                {isSaving ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Check color="#fff" size={18} style={{ marginRight: 6 }} />
                    <Text style={styles.saveBtnText}>Save Changes</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
  },
  avatarCard: {
    alignItems: 'center',
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  avatarText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '900',
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '700',
  },
  feedbackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.md,
  },
  feedbackText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  formCard: {
    padding: SPACING.lg,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
  },
  fieldGroup: {
    marginBottom: SPACING.md,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  cancelBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.lg,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
});
