import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import queueApi from '../../src/api/queueApi';
import { CustomerTicketStatus } from '../../src/types';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { Users, Ticket, ArrowRight, Clock, AlertCircle } from 'lucide-react-native';

export default function QueueScreen() {
  const { colors, isDark } = useTheme();
  const [activeTicket, setActiveTicket] = useState<CustomerTicketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchActive = async () => {
    try {
      const ticket = await queueApi.getMyActiveTicket();
      setActiveTicket(ticket);
    } catch (err) {
      console.warn('Failed to load active queue status', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActive();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActive();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CALLING':
        return colors.statusCalling;
      case 'SERVING':
        return colors.statusServing;
      case 'WAITING':
      default:
        return colors.statusWaiting;
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Your Active Queues</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Track your queue position and estimated service time in real time.</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching live queue entries...</Text>
        </View>
      ) : activeTicket ? (
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.cardHeader}>
            <View style={[styles.ticketBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)' }]}>
              <Ticket color={colors.primary} size={16} style={{ marginRight: 4 }} />
              <Text style={[styles.ticketBadgeText, { color: colors.primary }]}>QUEUE TICKET</Text>
            </View>
            <View style={[styles.statusTag, { backgroundColor: `${getStatusColor(activeTicket.status)}25` }]}>
              <Text style={[styles.statusText, { color: getStatusColor(activeTicket.status) }]}>
                {activeTicket.status}
              </Text>
            </View>
          </View>

          {/* Cancellation Reason Alert Banner */}
          {(activeTicket.status === 'CANCELLED' || activeTicket.cancellationReason) && (
            <View style={[styles.cancellationBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
              <View style={styles.cancellationHeaderRow}>
                <AlertCircle color={colors.danger} size={18} style={{ marginRight: 6 }} />
                <Text style={[styles.cancellationTitle, { color: colors.danger }]}>TICKET CANCELLED</Text>
              </View>
              {activeTicket.cancellationReason && (
                <View style={[styles.cancellationReasonBox, { backgroundColor: colors.surfaceLight }]}>
                  <Text style={[styles.cancellationReasonLabel, { color: colors.textMuted }]}>Reason:</Text>
                  <Text style={[styles.cancellationReasonText, { color: colors.text }]}>{activeTicket.cancellationReason}</Text>
                  {activeTicket.cancelledBy && (
                    <Text style={[styles.cancelledByText, { color: colors.textSecondary }]}>By: {activeTicket.cancelledBy}</Text>
                  )}
                </View>
              )}
            </View>
          )}

          <View style={styles.numberRow}>
            <Text style={[styles.ticketNumber, { color: colors.text }]}>{activeTicket.ticketNumber}</Text>
          </View>

          <View style={styles.detailsRow}>
            <Text style={[styles.serviceTitle, { color: colors.text }]}>{activeTicket.serviceName}</Text>
            <Text style={[styles.branchTitle, { color: colors.textSecondary }]}>{activeTicket.branchName}</Text>
            {activeTicket.branchLocation && (
              <Text style={[styles.locationTitle, { color: colors.textMuted }]}>{activeTicket.branchLocation}</Text>
            )}
          </View>

          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.metricVal, { color: colors.text }]}>{activeTicket.peopleAhead}</Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>People Ahead</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.metricVal, { color: colors.text }]}>#{activeTicket.position}</Text>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>Your Position</Text>
            </View>
            <View style={[styles.metricCard, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={[styles.metricVal, { color: colors.text }]}>~{activeTicket.estimatedWaitTimeMinutes}m</Text>
                {activeTicket.isDynamic && (
                  <View style={styles.dynamicBadge}>
                    <Text style={styles.dynamicBadgeText}>DYN</Text>
                  </View>
                )}
              </View>
              <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                {activeTicket.isDynamic && activeTicket.dynamicPaceMinutes
                  ? `Pace ~${activeTicket.dynamicPaceMinutes}m`
                  : 'Est. Wait'}
              </Text>
            </View>
          </View>

          {/* Now Serving Banner */}
          {activeTicket.nowServing && (
            <View style={[styles.nowServingRow, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
              <Clock color={colors.primary} size={16} style={{ marginRight: 6 }} />
              <Text style={[styles.nowServingText, { color: colors.textSecondary }]}>
                Counter Currently Serving:{' '}
                <Text style={{ fontWeight: '800', color: colors.text }}>
                  {activeTicket.nowServing.ticketNumber || `#${activeTicket.nowServing.position}`}
                </Text>
              </Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.openDetailsButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/queue/${activeTicket.entry.id}`)}
          >
            <Text style={styles.openDetailsText}>Open Interactive Live Tracker</Text>
            <ArrowRight color="#ffffff" size={16} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Users color={colors.textMuted} size={48} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Active Queue Ticket</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            You haven't joined a queue yet today. Discover an organization or scan a branch QR code to get started.
          </Text>
          <TouchableOpacity
            style={[styles.joinButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/queue/join')}
          >
            <Text style={styles.joinButtonText}>Find Services & Join Queue</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.xxl,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.md,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  ticketBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusTag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  numberRow: {
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  ticketNumber: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  detailsRow: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  serviceTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  branchTitle: {
    fontSize: 13,
    marginTop: 2,
  },
  locationTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  metricCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 18,
    fontWeight: '800',
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  nowServingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  nowServingText: {
    fontSize: 12,
  },
  openDetailsButton: {
    borderRadius: RADIUS.md,
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  openDetailsText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: SPACING.lg,
    lineHeight: 18,
  },
  joinButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  joinButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  cancellationBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.35)',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  cancellationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cancellationTitle: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cancellationReasonBox: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: RADIUS.sm,
    padding: SPACING.sm,
    marginTop: 2,
  },
  cancellationReasonLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cancellationReasonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  cancelledByText: {
    fontSize: 10,
    marginTop: 3,
  },
  dynamicBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  dynamicBadgeText: {
    color: '#10b981',
    fontSize: 9,
    fontWeight: '900',
  },
});
