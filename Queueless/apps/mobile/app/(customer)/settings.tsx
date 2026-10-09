import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useTheme } from '../../src/context/ThemeContext';
import { SPACING, RADIUS } from '../../src/constants/theme';
import {
  getAlertSettings,
  saveAlertSettings,
  triggerQueueAlert,
  AlertSettings,
} from '../../src/services/alertService';
import {
  Bell,
  Sun,
  Moon,
  User,
  ChevronRight,
  LogOut,
  Sparkles,
  Smartphone,
  FileText,
} from 'lucide-react-native';

export default function CustomerSettingsScreen() {
  const { user, logout } = useAuth();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();
  const router = useRouter();

  const [alertSettings, setAlertSettingsState] = useState<AlertSettings>({
    ring: true,
    vibrate: true,
    talkBack: true,
  });
  const [testingAlert, setTestingAlert] = useState(false);

  useEffect(() => {
    getAlertSettings().then(setAlertSettingsState);
  }, []);

  const handleToggleRing = async (value: boolean) => {
    const updated = await saveAlertSettings({ ring: value });
    setAlertSettingsState(updated);
  };

  const handleToggleVibrate = async (value: boolean) => {
    const updated = await saveAlertSettings({ vibrate: value });
    setAlertSettingsState(updated);
  };

  const handleToggleTalkBack = async (value: boolean) => {
    const updated = await saveAlertSettings({ talkBack: value });
    setAlertSettingsState(updated);
  };

  const handleTestAlerts = async () => {
    setTestingAlert(true);
    await triggerQueueAlert({
      type: 'NEAR',
      customMessage: 'Test alert. Your turn is up. Please proceed to the service desk.',
    });
    setTimeout(() => setTestingAlert(false), 2000);
  };

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of QueueLess?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  // Reusable custom switch toggle
  const renderToggle = (value: boolean, onToggle: (val: boolean) => void, activeColor: string) => (
    <TouchableOpacity
      style={[
        styles.switchTrack,
        { backgroundColor: value ? activeColor : colors.surfaceBorder },
      ]}
      onPress={() => onToggle(!value)}
      activeOpacity={0.8}
    >
      <View style={[styles.switchThumb, value && styles.switchThumbActive]} />
    </TouchableOpacity>
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* Account Profile Card */}
      <View style={[styles.profileCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.fullName?.[0]?.toUpperCase() || 'C'}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: colors.text }]}>{user?.fullName || 'Customer'}</Text>
            <Text style={[styles.profileEmail, { color: colors.textSecondary }]}>{user?.email || 'N/A'}</Text>
            <View style={[styles.roleBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)' }]}>
              <Text style={[styles.roleText, { color: colors.primary }]}>Verified Customer</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.editProfileBtn, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : colors.surfaceLight, borderColor: colors.surfaceBorder }]}
          onPress={() => router.push('/profile/edit')}
          activeOpacity={0.7}
        >
          <View style={styles.btnLeft}>
            <User color={colors.primary} size={18} style={{ marginRight: 10 }} />
            <Text style={[styles.editProfileText, { color: colors.text }]}>Edit Personal Details</Text>
          </View>
          <ChevronRight color={colors.textMuted} size={18} />
        </TouchableOpacity>
      </View>

      {/* Section: Alerts & Notifications */}
      <View style={styles.sectionHeaderRow}>
        <Bell color={colors.primary} size={18} style={{ marginRight: 6 }} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Queue Alerts & Sound</Text>
      </View>
      <Text style={[styles.sectionDesc, { color: colors.textSecondary }]}>
        Configure how your phone alerts you when your queue turn approaches or is called.
      </Text>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        {/* Ring / Chime */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : '#EFF6FF' }]}>
              <Bell color={colors.primary} size={20} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Ring (Audio Chime)</Text>
              <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                Play pleasant notification chime when ticket updates
              </Text>
            </View>
          </View>
          {renderToggle(alertSettings.ring, handleToggleRing, colors.primary)}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Vibrate */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5' }]}>
              <Smartphone color={colors.success} size={20} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>Vibrate</Text>
              <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                Haptic vibration pulses on upcoming turn and in service
              </Text>
            </View>
          </View>
          {renderToggle(alertSettings.vibrate, handleToggleVibrate, colors.success)}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* TalkBack / Voice Speech */}
        <View style={styles.settingRow}>
          <View style={styles.settingLeft}>
            <View style={[styles.settingIconWrap, { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB' }]}>
              <Sparkles color="#F59E0B" size={20} />
            </View>
            <View style={styles.settingTextGroup}>
              <Text style={[styles.settingLabel, { color: colors.text }]}>TalkBack (Voice Announcements)</Text>
              <Text style={[styles.settingSubtext, { color: colors.textSecondary }]}>
                Speaks aloud: "Your turn is up, please move to the desk"
              </Text>
            </View>
          </View>
          {renderToggle(alertSettings.talkBack, handleToggleTalkBack, '#F59E0B')}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

        {/* Test Alerts Button */}
        <TouchableOpacity
          style={[styles.testAlertBtn, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : '#EFF6FF', borderColor: colors.primary }]}
          onPress={handleTestAlerts}
          disabled={testingAlert}
          activeOpacity={0.8}
        >
          <Sparkles color={colors.primary} size={16} style={{ marginRight: 8 }} />
          <Text style={[styles.testAlertText, { color: colors.primary }]}>
            {testingAlert ? 'Testing Alerts (Ring, Vibrate, TalkBack)...' : 'Test Active Alerts Preview'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Section: Theme */}
      <View style={[styles.sectionHeaderRow, { marginTop: SPACING.xl }]}>
        <Sun color={colors.primary} size={18} style={{ marginRight: 6 }} />
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Appearance</Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.themeToggleRow}>
          <TouchableOpacity
            style={[
              styles.themeOption,
              !isDark && [styles.themeOptionActive, { borderColor: colors.primary, backgroundColor: isDark ? 'transparent' : '#EFF6FF' }],
              { borderColor: colors.surfaceBorder },
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.8}
          >
            <Sun color={!isDark ? colors.primary : colors.textMuted} size={22} style={{ marginBottom: 6 }} />
            <Text style={[styles.themeOptionText, { color: !isDark ? colors.primary : colors.textSecondary, fontWeight: !isDark ? '800' : '600' }]}>
              Light Mode
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.themeOption,
              isDark && [styles.themeOptionActive, { borderColor: colors.primary, backgroundColor: 'rgba(59, 130, 246, 0.15)' }],
              { borderColor: colors.surfaceBorder },
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.8}
          >
            <Moon color={isDark ? colors.primary : colors.textMuted} size={22} style={{ marginBottom: 6 }} />
            <Text style={[styles.themeOptionText, { color: isDark ? colors.primary : colors.textSecondary, fontWeight: isDark ? '800' : '600' }]}>
              Dark Mode
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Section: App Version & Info */}
      <View style={[styles.infoCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder, marginTop: SPACING.xl }]}>
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Application</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>QueueLess Customer Mobile</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Version</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>1.0.0 (Build 42)</Text>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />
        <View style={styles.infoRow}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Real-Time Engine</Text>
          <Text style={[styles.infoValue, { color: colors.success }]}>Connected (WebSocket)</Text>
        </View>
      </View>

      {/* Sign Out Button */}
      <TouchableOpacity
        style={[styles.logoutButton, { backgroundColor: colors.surface, borderColor: colors.danger }]}
        onPress={handleSignOut}
        activeOpacity={0.8}
      >
        <LogOut color={colors.danger} size={18} style={{ marginRight: 8 }} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Sign Out of QueueLess</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl + 40,
  },
  profileCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileEmail: {
    fontSize: 13,
    marginTop: 2,
  },
  roleBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  btnLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editProfileText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  sectionDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.md,
  },
  card: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: SPACING.sm,
  },
  settingIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  settingTextGroup: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingSubtext: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  switchTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2.5,
    elevation: 2,
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  divider: {
    height: 1,
    marginVertical: 8,
  },
  testAlertBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginTop: 6,
  },
  testAlertText: {
    fontSize: 13,
    fontWeight: '800',
  },
  themeToggleRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  themeOptionActive: {
    borderWidth: 2,
  },
  themeOptionText: {
    fontSize: 13,
  },
  infoCard: {
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  infoLabel: {
    fontSize: 13,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: RADIUS.xl,
    borderWidth: 1.5,
    marginTop: SPACING.xl,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '800',
  },
});
