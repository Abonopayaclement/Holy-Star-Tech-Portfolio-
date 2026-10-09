import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import organizationApi from '../../src/api/organizationApi';
import queueApi from '../../src/api/queueApi';
import { QRResolutionResult } from '../../src/types';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { Clock, MapPin, Users, Calendar, ArrowRight, CheckCircle2, AlertCircle, QrCode } from 'lucide-react-native';
import { ScreenWrapper, MobileHeader } from '../../src/components';

export default function ServiceDetailsScreen() {
  const { serviceId, qrToken } = useLocalSearchParams<{ serviceId: string; qrToken?: string }>();
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();
  const [data, setData] = useState<QRResolutionResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true);
        // resolveQr endpoint can resolve by qrToken or serviceId
        const tokenToResolve = qrToken || serviceId;
        const res = await organizationApi.resolveQr(tokenToResolve);
        setData(res);
      } catch (err: any) {
        // If qrToken failed (e.g. expired/revoked), fallback to fetching serviceId directly for view
        if (qrToken && serviceId) {
          try {
            const fallbackRes = await organizationApi.resolveQr(serviceId);
            setData(fallbackRes);
            return;
          } catch {
            // continue to alert below
          }
        }
        Alert.alert('Service Not Found', err.message || 'Unable to locate service details.');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId || qrToken) fetchService();
  }, [serviceId, qrToken]);

  const handleJoin = async () => {
    const queueId = data?.service?.queueId;
    if (!queueId || !data?.service?.isQueueOpen) {
      Alert.alert(
        'Queue Currently Closed',
        `${data?.service?.name || 'This service'} is not accepting new customers right now. Existing customers are still being served. Please try again later.`
      );
      return;
    }

    if (!user && !token) {
      Alert.alert(
        'Sign In Required',
        'Please sign in or create a customer account to join the live queue and track your ticket.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Sign In',
            onPress: () => router.push('/(auth)/login'),
          },
        ]
      );
      return;
    }

    setJoining(true);
    try {
      const entry = await queueApi.joinQueue(queueId, { qrToken });
      router.push(`/queue/${entry.id}`);
    } catch (err: any) {
      if (err.message?.includes('Unauthorized') || err.message?.includes('token')) {
        Alert.alert(
          'Sign In Required',
          'Your session has expired. Please sign in again to join the queue.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          ]
        );
      } else {
        Alert.alert('Unable to Join Queue', err.response?.data?.error || err.message || 'Please try again later.');
      }
    } finally {
      setJoining(false);
    }
  };

  return (
    <ScreenWrapper safeTop={false} safeBottom={true}>
      <MobileHeader title={data?.service?.name || 'Service Details'} showBack />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading service information...</Text>
        </View>
      ) : !data || !data.service ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Service Not Found</Text>
        </View>
      ) : (
        <>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            {qrToken ? (
              <View style={[styles.qrBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)', borderColor: colors.primary }]}>
                <QrCode color={colors.primary} size={13} style={{ marginRight: 6 }} />
                <Text style={[styles.qrBadgeText, { color: colors.primary }]}>SCANNED VIA SERVICE QR CODE</Text>
              </View>
            ) : null}

            <View style={[styles.statusPill, !data.service.isQueueOpen && styles.statusPillClosed]}>
              <Text style={[styles.statusPillText, !data.service.isQueueOpen && styles.statusPillClosedText]}>
                {data.service.isQueueOpen ? '● QUEUE OPEN' : '○ QUEUE CLOSED'}
              </Text>
            </View>

            <Text style={[styles.serviceTitle, { color: colors.text }]}>{data.service.name}</Text>
            <Text style={[styles.orgBranchText, { color: colors.textSecondary }]}>
              {data.branch.name} • {data.organization.name}
            </Text>

            {data.service.description && (
              <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{data.service.description}</Text>
            )}

            <View style={[styles.divider, { backgroundColor: colors.surfaceBorder }]} />

            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Clock color={colors.primary} size={18} style={{ marginBottom: 4 }} />
                <Text style={[styles.metricVal, { color: colors.text }]}>~{data.service.duration} mins</Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>Est. Duration</Text>
              </View>

              <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />

              <View style={styles.metricItem}>
                <Users color={colors.primary} size={18} style={{ marginBottom: 4 }} />
                <Text style={[styles.metricVal, { color: data.service.isQueueOpen ? colors.text : colors.danger }]}>
                  {data.service.isQueueOpen ? 'Open' : 'Closed'}
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>Queue Status</Text>
              </View>
            </View>
          </View>

          {/* Queue Closed Explanation Banner */}
          {!data.service.isQueueOpen && (
            <View style={styles.closedBanner}>
              <AlertCircle color={colors.danger} size={18} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.closedBannerTitle, { color: colors.danger }]}>Queue Currently Closed</Text>
                <Text style={[styles.closedBannerText, { color: colors.textSecondary }]}>
                  This service is currently unavailable for new queue entries. Reason: {(data.service as any).closedReason || (data.service as any).queueClosedReason || 'Branch closing soon'}
                </Text>
              </View>
            </View>
          )}

          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[
                styles.joinBtn,
                { backgroundColor: colors.primary },
                (!data.service.isQueueOpen || joining) && styles.btnDisabled,
              ]}
              onPress={handleJoin}
              disabled={!data.service.isQueueOpen || joining}
              activeOpacity={0.85}
            >
              {joining ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Users color="#ffffff" size={18} style={{ marginRight: 8 }} />
                  <Text style={styles.joinBtnText}>
                    {data.service.isQueueOpen ? 'Join Live Queue' : 'Queue Currently Closed'}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.bookBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
              onPress={() =>
                router.push({
                  pathname: '/appointment/book',
                  params: { branchId: data.branch.id, serviceId: data.service?.id },
                })
              }
              activeOpacity={0.85}
            >
              <Calendar color={colors.primary} size={18} style={{ marginRight: 8 }} />
              <Text style={[styles.bookBtnText, { color: colors.primary }]}>Book Appointment Instead</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    padding: SPACING.lg,
  },
  loadingWrapper: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.md,
  },
  emptyCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderColor: 'rgba(59, 130, 246, 0.35)',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
  },
  qrBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.md,
  },
  statusPillClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  statusPillText: {
    color: COLORS.statusServing,
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillClosedText: {
    color: COLORS.danger,
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  closedBannerTitle: {
    color: COLORS.danger,
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 2,
  },
  closedBannerText: {
    color: COLORS.textSecondary,
    fontSize: 12,
    lineHeight: 16,
  },
  serviceTitle: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  orgBranchText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginTop: SPACING.md,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.surfaceBorder,
    marginVertical: SPACING.lg,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
  },
  metricVal: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  metricSub: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  metricDivider: {
    width: 1,
    height: 36,
    backgroundColor: COLORS.surfaceBorder,
  },
  actionContainer: {
    gap: SPACING.md,
  },
  joinBtn: {
    height: 50,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
  },
  bookBtn: {
    height: 50,
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookBtnText: {
    color: COLORS.primaryLight,
    fontSize: 15,
    fontWeight: '700',
  },
});
