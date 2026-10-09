import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import queueApi from '../../src/api/queueApi';
import appointmentApi from '../../src/api/appointmentApi';
import { QueueEntry, Appointment } from '../../src/types';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import {
  Clock,
  Ticket,
  Calendar,
  CheckCircle,
  XCircle,
  EyeOff,
  ChevronRight,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
} from 'lucide-react-native';

export default function HistoryScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'QUEUES' | 'APPOINTMENTS'>('QUEUES');
  const [queueHistory, setQueueHistory] = useState<QueueEntry[]>([]);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHistory = async () => {
    try {
      const [qRes, aRes] = await Promise.allSettled([
        queueApi.getMyQueueHistory(),
        appointmentApi.getMyAppointments(),
      ]);

      if (qRes.status === 'fulfilled') {
        setQueueHistory(qRes.value);
      }
      if (aRes.status === 'fulfilled') {
        setAppointmentHistory(aRes.value);
      }
    } catch (err) {
      console.warn('Failed to load history', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const handleHideQueueEntry = (entryId: string, ticketNum?: string) => {
    Alert.alert(
      'Remove from History',
      `Hide ticket ${ticketNum || ''} from your personal history? This record will remain in authoritative records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await queueApi.hideTicket(entryId);
              setQueueHistory((prev) => prev.filter((item) => item.id !== entryId));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Unable to hide ticket from history.');
            }
          },
        },
      ]
    );
  };

  const handleHideAppointment = (appointmentId: string, title?: string) => {
    Alert.alert(
      'Remove from History',
      `Hide ${title || 'this appointment'} from your personal history? This record will remain in authoritative records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await appointmentApi.hideAppointment(appointmentId);
              setAppointmentHistory((prev) => prev.filter((item) => item.id !== appointmentId));
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Unable to hide appointment from history.');
            }
          },
        },
      ]
    );
  };

  const getQueueStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: 'rgba(16, 185, 129, 0.15)', text: colors.success };
      case 'CANCELLED':
        return { label: 'CANCELLED', bg: 'rgba(239, 68, 68, 0.15)', text: colors.danger };
      case 'SKIPPED':
      case 'ABSENT':
        return { label: status, bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b' };
      default:
        return { label: status, bg: 'rgba(100, 116, 139, 0.15)', text: colors.textMuted };
    }
  };

  const getAppointmentStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return { label: 'COMPLETED', bg: 'rgba(16, 185, 129, 0.15)', text: colors.success };
      case 'REJECTED':
      case 'CANCELLED':
        return { label: status, bg: 'rgba(239, 68, 68, 0.15)', text: colors.danger };
      case 'APPROVED':
      case 'PAID':
        return { label: status, bg: 'rgba(37, 99, 235, 0.15)', text: colors.primary };
      case 'IN_PROGRESS':
        return { label: 'IN PROGRESS', bg: 'rgba(6, 182, 212, 0.15)', text: colors.info };
      default:
        return { label: status, bg: 'rgba(100, 116, 139, 0.15)', text: colors.textMuted };
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Activity History</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Records of your previous tickets and appointments
        </Text>
      </View>

      {/* Switcher */}
      <View style={[styles.tabSwitcher, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <TouchableOpacity
          style={[styles.switchTab, activeTab === 'QUEUES' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('QUEUES')}
        >
          <Ticket size={16} color={activeTab === 'QUEUES' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.switchTabText, { color: activeTab === 'QUEUES' ? '#ffffff' : colors.textMuted }]}>
            Queue Tickets ({queueHistory.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switchTab, activeTab === 'APPOINTMENTS' && { backgroundColor: colors.primary }]}
          onPress={() => setActiveTab('APPOINTMENTS')}
        >
          <Calendar size={16} color={activeTab === 'APPOINTMENTS' ? '#ffffff' : colors.textMuted} />
          <Text style={[styles.switchTabText, { color: activeTab === 'APPOINTMENTS' ? '#ffffff' : colors.textMuted }]}>
            Appointments ({appointmentHistory.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Fetching history records...</Text>
        </View>
      ) : activeTab === 'QUEUES' ? (
        queueHistory.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <Clock color={colors.textMuted} size={40} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No Queue History</Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              You have no completed or cancelled queue entries yet.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            {queueHistory.map((entry) => {
              const badge = getQueueStatusBadge(entry.status);
              return (
                <TouchableOpacity
                  key={entry.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => router.push(`/queue/${entry.id}`)}
                  activeOpacity={0.7}
                >
                  <View style={styles.cardRow}>
                    <View style={[styles.ticketBadge, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                      <Text style={[styles.ticketBadgeNum, { color: colors.primary }]}>
                        {entry.ticketNumber || `#${entry.position}`}
                      </Text>
                    </View>
                    <View style={styles.cardMain}>
                      <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
                        {entry.queue?.service?.name || 'Service'}
                      </Text>
                      <Text style={[styles.branchName, { color: colors.textSecondary }]} numberOfLines={1}>
                        {entry.queue?.branch?.name}
                        {entry.queue?.branch?.organization?.name ? ` • ${entry.queue.branch.organization.name}` : ''}
                      </Text>
                      <Text style={[styles.dateText, { color: colors.textMuted }]}>
                        {new Date(entry.joinedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                        {badge.label}
                      </Text>
                    </View>
                  </View>

                  {entry.cancellationReason && (
                    <View style={[styles.cancellationBox, { borderTopColor: colors.surfaceBorder }]}>
                      <Text style={[styles.cancellationLabel, { color: colors.danger }]}>Reason:</Text>
                      <Text style={[styles.cancellationText, { color: colors.text }]}>{entry.cancellationReason}</Text>
                      {entry.cancelledBy && (
                        <Text style={[styles.cancelledByText, { color: colors.textSecondary }]}>By: {entry.cancelledBy}</Text>
                      )}
                    </View>
                  )}

                  {/* Card Actions Footer */}
                  <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                    <View style={styles.viewDetailsRow}>
                      <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Ticket Tracker</Text>
                      <ChevronRight size={14} color={colors.primary} />
                    </View>
                    <TouchableOpacity
                      style={styles.hideButton}
                      onPress={(e: any) => {
                        e.stopPropagation?.();
                        handleHideQueueEntry(entry.id, entry.ticketNumber);
                      }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      activeOpacity={0.7}
                    >
                      <EyeOff size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                      <Text style={[styles.hideButtonText, { color: colors.textMuted }]}>Hide</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )
      ) : appointmentHistory.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Calendar color={colors.textMuted} size={40} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Appointment History</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>You have no appointment records yet.</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {appointmentHistory.map((item) => {
            const badge = getAppointmentStatusBadge(item.status);
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => router.push(`/appointment/${item.id}`)}
                activeOpacity={0.7}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardMain}>
                    <Text style={[styles.serviceName, { color: colors.text }]} numberOfLines={1}>
                      {item.category?.name || item.problemType || item.service?.name || 'Remote Service'}
                    </Text>
                    <Text style={[styles.branchName, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.branch?.name}
                      {item.branch?.organization?.name ? ` • ${item.branch.organization.name}` : ''}
                    </Text>
                    <Text style={[styles.dateText, { color: colors.textMuted }]}>
                      {item.scheduledTime
                        ? new Date(item.scheduledTime).toLocaleDateString([], {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Remote Service Case'}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Solved/Unsolved Status Pill */}
                {item.isProblemSolved !== undefined && item.isProblemSolved !== null && (
                  <View style={[styles.feedbackSnippet, { backgroundColor: item.isProblemSolved ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)' }]}>
                    {item.isProblemSolved ? (
                      <>
                        <ThumbsUp size={12} color={colors.success} style={{ marginRight: 4 }} />
                        <Text style={[styles.feedbackSnippetText, { color: colors.success }]}>Problem Solved</Text>
                      </>
                    ) : (
                      <>
                        <ThumbsDown size={12} color={colors.danger} style={{ marginRight: 4 }} />
                        <Text style={[styles.feedbackSnippetText, { color: colors.danger }]}>Problem Unsolved — Follow-up Available</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Card Actions Footer */}
                <View style={[styles.cardFooter, { borderTopColor: colors.surfaceBorder }]}>
                  <View style={styles.viewDetailsRow}>
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View Case & Follow-up</Text>
                    <ChevronRight size={14} color={colors.primary} />
                  </View>
                  <TouchableOpacity
                    style={styles.hideButton}
                    onPress={(e: any) => {
                      e.stopPropagation?.();
                      handleHideAppointment(item.id, item.category?.name || item.problemType || 'appointment');
                    }}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <EyeOff size={14} color={colors.textMuted} style={{ marginRight: 4 }} />
                    <Text style={[styles.hideButtonText, { color: colors.textMuted }]}>Hide</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
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
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  tabSwitcher: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: 4,
    marginBottom: SPACING.lg,
  },
  switchTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: RADIUS.md,
  },
  switchTabActive: {},
  switchTabText: {
    fontSize: 12,
    fontWeight: '700',
  },
  switchTabTextActive: {
    color: '#ffffff',
  },
  loadingContainer: {
    padding: SPACING.xxl,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 13,
    marginTop: SPACING.md,
  },
  emptyCard: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.md,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticketBadge: {
    width: 60,
    height: 48,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  ticketBadgeNum: {
    fontSize: 14,
    fontWeight: '900',
  },
  cardMain: {
    flex: 1,
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '700',
  },
  branchName: {
    fontSize: 12,
    marginTop: 1,
  },
  dateText: {
    fontSize: 11,
    marginTop: 3,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  cancellationBox: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
  },
  cancellationLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cancellationText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 1,
  },
  cancelledByText: {
    fontSize: 10,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
  },
  viewDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
  },
  hideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  hideButtonText: {
    fontSize: 11,
    fontWeight: '600',
  },
  feedbackSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs + 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  feedbackSnippetText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
