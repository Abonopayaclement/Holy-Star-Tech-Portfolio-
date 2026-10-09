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
import { Branch, Service } from '../../src/types';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { MapPin, Clock, Users, Calendar, ArrowRight, Tag, CheckCircle2, AlertCircle } from 'lucide-react-native';
import { ScreenWrapper, MobileHeader } from '../../src/components';

export default function BranchDetailsScreen() {
  const { branchId } = useLocalSearchParams<{ branchId: string }>();
  const { colors, isDark } = useTheme();
  const [branch, setBranch] = useState<Branch | null>(null);
  const [loading, setLoading] = useState(true);
  const [joiningServiceId, setJoiningServiceId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBranch = async () => {
      try {
        setLoading(true);
        const data = await organizationApi.getBranch(branchId);
        setBranch(data);
      } catch (err: any) {
        Alert.alert('Error', err.message || 'Failed to load branch details');
      } finally {
        setLoading(false);
      }
    };

    if (branchId) fetchBranch();
  }, [branchId]);

  const handleJoinQueue = async (service: Service) => {
    const targetQueue = service.queues?.find((q) => q.status === 'OPEN') || service.queues?.[0];
    if (!targetQueue || targetQueue.status !== 'OPEN') {
      Alert.alert(
        'Queue Currently Closed',
        `${service.name} is not accepting new customers right now. Existing customers are still being served. Please try again later.`
      );
      return;
    }

    setJoiningServiceId(service.id);
    try {
      const entry = await queueApi.joinQueue(targetQueue.id);
      router.push(`/queue/${entry.id}`);
    } catch (err: any) {
      Alert.alert('Unable to Join Queue', err.response?.data?.error || err.message || 'Please try again later.');
    } finally {
      setJoiningServiceId(null);
    }
  };

  return (
    <ScreenWrapper safeTop={false} safeBottom={true}>
      <MobileHeader title={branch?.name || 'Branch Details'} showBack />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading branch services...</Text>
        </View>
      ) : !branch ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Branch Not Found</Text>
        </View>
      ) : (
        <>
          {/* Branch Header Card */}
          <View style={[styles.branchHeader, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Text style={[styles.orgNameTag, { color: colors.primary }]}>{branch.organization?.name}</Text>
            <Text style={[styles.branchName, { color: colors.text }]}>{branch.name}</Text>
            <View style={styles.locationRow}>
              <MapPin color={colors.primary} size={15} style={{ marginRight: 4 }} />
              <Text style={[styles.locationText, { color: colors.textSecondary }]}>{branch.location}</Text>
            </View>
            <View style={styles.hoursRow}>
              <Clock color={colors.textMuted} size={13} style={{ marginRight: 4 }} />
              <Text style={[styles.hoursText, { color: colors.textMuted }]}>Hours: {branch.operatingHours || '08:00 - 17:00'}</Text>
            </View>
          </View>

          {/* Services Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Services</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Select a service to join the live queue or schedule a visit
            </Text>
          </View>

          <View style={styles.servicesList}>
            {branch.services?.map((service: Service) => {
              const isJoining = joiningServiceId === service.id;
              const targetQueue = service.queues?.[0];
              const hasOpenQueue = targetQueue?.status === 'OPEN';
              const closedReason = (targetQueue as any)?.closedReason || 'Branch closing soon';

              return (
                <View key={service.id} style={[styles.serviceCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <View style={styles.serviceHeader}>
                    <View style={styles.serviceTitleWrapper}>
                      <Text style={[styles.serviceName, { color: colors.text }]}>{service.name}</Text>
                      {service.description && (
                        <Text style={[styles.serviceDesc, { color: colors.textSecondary }]}>{service.description}</Text>
                      )}
                    </View>
                  </View>

                  <View style={styles.metaBadgeRow}>
                    <View style={[styles.metaPill, { backgroundColor: colors.surfaceLight }]}>
                      <Clock color={colors.textSecondary} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaPillText, { color: colors.textSecondary }]}>~{service.duration} mins duration</Text>
                    </View>
                    {hasOpenQueue ? (
                      <View style={[styles.metaPill, styles.metaPillOpen]}>
                        <Text style={styles.metaPillOpenText}>🟢 Queue Open</Text>
                      </View>
                    ) : (
                      <View style={[styles.metaPill, styles.metaPillClosed]}>
                        <Text style={styles.metaPillClosedText}>🔴 Queue Closed</Text>
                      </View>
                    )}
                  </View>

                  {!hasOpenQueue && (
                    <View style={styles.closedBanner}>
                      <AlertCircle color={colors.danger} size={14} style={{ marginRight: 6, marginTop: 1 }} />
                      <Text style={[styles.closedBannerText, { color: colors.danger }]}>
                        Queue Closed: This service is currently unavailable for new queue entries. Reason: {closedReason}
                      </Text>
                    </View>
                  )}

                  {/* Dual Action Buttons */}
                  <View style={styles.buttonRow}>
                    <TouchableOpacity
                      style={[
                        styles.joinBtn,
                        { backgroundColor: colors.primary },
                        (!hasOpenQueue || isJoining) && styles.btnDisabled,
                      ]}
                      onPress={() => handleJoinQueue(service)}
                      disabled={!hasOpenQueue || isJoining}
                      activeOpacity={0.8}
                    >
                      {isJoining ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Users color="#ffffff" size={15} style={{ marginRight: 6 }} />
                          <Text style={styles.joinBtnText}>
                            {hasOpenQueue ? 'Join Queue' : 'Queue Closed'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.bookBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
                      onPress={() =>
                        router.push({
                          pathname: '/appointment/book',
                          params: { branchId: branch.id, serviceId: service.id },
                        })
                      }
                      activeOpacity={0.8}
                    >
                      <Calendar color={colors.primary} size={15} style={{ marginRight: 6 }} />
                      <Text style={[styles.bookBtnText, { color: colors.primary }]}>Book Slot</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
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
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
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
  branchHeader: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  orgNameTag: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  branchName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  locationText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hoursText: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  servicesList: {
    gap: SPACING.md,
  },
  serviceCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
  },
  serviceHeader: {
    marginBottom: SPACING.sm,
  },
  serviceTitleWrapper: {
    flex: 1,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  serviceDesc: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  metaBadgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: SPACING.md,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  metaPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  metaPillOpen: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  metaPillOpenText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  metaPillClosed: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
  },
  metaPillClosedText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  closedBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    marginBottom: SPACING.md,
  },
  closedBannerText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  joinBtn: {
    flex: 1,
    height: 42,
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  bookBtn: {
    flex: 1,
    height: 42,
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
    fontSize: 13,
    fontWeight: '700',
  },
});
