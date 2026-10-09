import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, RADIUS } from '../src/constants/theme';
import {
  ArrowLeft,
  Sun,
  Moon,
  Check,
  Bell,
  Vibrate,
  Shield,
  Smartphone,
  CheckCircle2,
} from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, themeMode, setThemeMode, isDark } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Math.max(insets.top, 16) + 8,
            backgroundColor: colors.surface,
            borderBottomColor: colors.surfaceBorder,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.cardSubtext, { color: colors.textMuted }]}>
            QueueLess defaults to clean Light Mode for optimal readability. You can switch themes at any time.
          </Text>

          {/* Light Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              {
                borderColor: themeMode === 'light' ? colors.primary : colors.surfaceBorder,
                backgroundColor: themeMode === 'light' ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.06)') : colors.surfaceLight,
              },
            ]}
            onPress={() => setThemeMode('light')}
            activeOpacity={0.8}
          >
            <View style={styles.themeOptionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#fef3c7' }]}>
                <Sun color="#d97706" size={20} />
              </View>
              <View>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>Light Mode</Text>
                <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>Clean, bright & high contrast (Default)</Text>
              </View>
            </View>
            {themeMode === 'light' && (
              <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                <Check color="#ffffff" size={14} />
              </View>
            )}
          </TouchableOpacity>

          {/* Dark Mode Option */}
          <TouchableOpacity
            style={[
              styles.themeOptionRow,
              {
                borderColor: themeMode === 'dark' ? colors.primary : colors.surfaceBorder,
                backgroundColor: themeMode === 'dark' ? (isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.06)') : colors.surfaceLight,
                marginTop: SPACING.sm,
              },
            ]}
            onPress={() => setThemeMode('dark')}
            activeOpacity={0.8}
          >
            <View style={styles.themeOptionLeft}>
              <View style={[styles.iconCircle, { backgroundColor: '#1e293b' }]}>
                <Moon color="#38bdf8" size={20} />
              </View>
              <View>
                <Text style={[styles.themeOptionTitle, { color: colors.text }]}>Dark Mode</Text>
                <Text style={[styles.themeOptionDesc, { color: colors.textMuted }]}>Sleek deep navy dark canvas</Text>
              </View>
            </View>
            {themeMode === 'dark' && (
              <View style={[styles.checkBadge, { backgroundColor: colors.primary }]}>
                <Check color="#ffffff" size={14} />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Real-time Notifications & Alerts Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>QUEUE NOTIFICATIONS & ALERTS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.infoRow}>
            <View style={[styles.smallIconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
              <Bell color={colors.primary} size={16} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Milestone Proximity Alerts</Text>
              <Text style={[styles.infoDesc, { color: colors.textMuted }]}>
                Active notifications at ~5 customers ahead, ~2 customers ahead, and when called.
              </Text>
            </View>
            <CheckCircle2 color={colors.success} size={18} />
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.infoRow}>
            <View style={[styles.smallIconCircle, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
              <Vibrate color={colors.success} size={16} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Audio & Haptic Feedback</Text>
              <Text style={[styles.infoDesc, { color: colors.textMuted }]}>
                Vibration patterns trigger immediately when your ticket is called by staff.
              </Text>
            </View>
            <CheckCircle2 color={colors.success} size={18} />
          </View>
        </View>

        {/* Security & System Info */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>ABOUT QUEUELESS</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.infoRow}>
            <View style={[styles.smallIconCircle, { backgroundColor: colors.surfaceLight }]}>
              <Shield color={colors.textSecondary} size={16} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Verified System</Text>
              <Text style={[styles.infoDesc, { color: colors.textMuted }]}>Socket.io Real-time Connected</Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

          <View style={styles.infoRow}>
            <View style={[styles.smallIconCircle, { backgroundColor: colors.surfaceLight }]}>
              <Smartphone color={colors.textSecondary} size={16} />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Client Version</Text>
              <Text style={[styles.infoDesc, { color: colors.textMuted }]}>QueueLess Mobile v1.2.0</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  content: {
    padding: SPACING.md,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
    paddingHorizontal: 4,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardSubtext: {
    fontSize: 13,
    marginBottom: SPACING.md,
    lineHeight: 18,
  },
  themeOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderWidth: 2,
    borderRadius: RADIUS.lg,
  },
  themeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  themeOptionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  themeOptionDesc: {
    fontSize: 12,
    marginTop: 2,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  smallIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  infoDesc: {
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    marginVertical: SPACING.md,
  },
});
