import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import queueApi from '../../src/api/queueApi';
import { CustomerTicketStatus, EntryStatus, PriorityLevel, NotificationPreference } from '../../src/types';
import { useQueueSocket } from '../../src/hooks/useQueueSocket';
import notificationService from '../../src/services/notificationService';
import { triggerQueueAlert } from '../../src/services/alertService';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { ScreenWrapper, MobileHeader } from '../../src/components';
import {
  Ticket,
  Clock,
  Users,
  Building,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Bell,
  Sparkles,
  MapPin,
  Lock,
  EyeOff,
  RefreshCw,
  Calendar,
  MessageSquare,
} from 'lucide-react-native';
import CustomerContactModal from '../../src/components/CustomerContactModal';

export default function TicketTrackerScreen() {
  const { ticketId } = useLocalSearchParams<{ ticketId: string }>();
  const { colors, isDark } = useTheme();
  const [ticketStatus, setTicketStatus] = useState<CustomerTicketStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [updatingPref, setUpdatingPref] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const prevStatusRef = useRef<EntryStatus | null>(null);
  const prevPeopleAheadRef = useRef<number | null>(null);
  const prevServiceNameRef = useRef<string | null>(null);
  const router = useRouter();

  const handleUpdatePref = async (newPref: NotificationPreference) => {
    if (!ticketId || updatingPref) return;
    setUpdatingPref(true);
    try {
      await queueApi.updatePreference(ticketId, newPref);
      setTicketStatus((prev) => (prev ? { ...prev, notificationPreference: newPref } : null));
    } catch (err: any) {
      Alert.alert('Update Failed', err.response?.data?.error || err.message || 'Could not update notification preference.');
    } finally {
      setUpdatingPref(false);
    }
  };

  const fetchStatus = useCallback(async () => {
    try {
      const data = await queueApi.getTicketStatus(ticketId);
      setTicketStatus(data);

      // Detect service transfer event
      if (prevServiceNameRef.current && prevServiceNameRef.current !== data.serviceName) {
        notificationService.notifyServiceTransferred(
          data.ticketNumber,
          prevServiceNameRef.current,
          data.serviceName,
          data.transferReason || undefined
        );
      }

      // Check status transitions for notifications & alerts (Ring, Vibrate, TalkBack)
      if (prevStatusRef.current && prevStatusRef.current !== data.status) {
        if (data.status === 'CALLING') {
          notificationService.notifyTicketCalled(data.ticketNumber, data.branchName);
          triggerQueueAlert({
            type: 'NEAR',
            customMessage: `Ticket ${data.ticketNumber}. Your turn is up. Please proceed to the service desk.`,
          });
        } else if (data.status === 'SERVING') {
          triggerQueueAlert({
            type: 'SERVING',
            customMessage: `Ticket ${data.ticketNumber}. You are now being served.`,
          });
        }
      }

      // Check proximity respecting customer notification preference
      const pref = data.notificationPreference || 'STANDARD';
      if (prevPeopleAheadRef.current !== null && data.status === 'WAITING') {
        if (
          prevPeopleAheadRef.current > 5 &&
          data.peopleAhead <= 5 &&
          (pref === 'STANDARD' || pref === 'NOTIFY_APPROACHING_5')
        ) {
          notificationService.notifyQueueApproaching(data.ticketNumber, data.peopleAhead);
        } else if (
          prevPeopleAheadRef.current > 2 &&
          data.peopleAhead <= 2 &&
          (pref === 'STANDARD' || pref === 'NOTIFY_APPROACHING_5' || pref === 'NOTIFY_APPROACHING_2')
        ) {
          notificationService.notifyQueueApproaching(data.ticketNumber, data.peopleAhead);
          triggerQueueAlert({
            type: 'NEAR',
            customMessage: `Your queue is near. Only ${data.peopleAhead} people ahead of you.`,
          });
        }
      }

      prevStatusRef.current = data.status;
      prevPeopleAheadRef.current = data.peopleAhead;
      prevServiceNameRef.current = data.serviceName;
    } catch (err: any) {
      console.warn('Failed to fetch ticket status:', err);
    } finally {
      setLoading(false);
    }
  }, [ticketId]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Connect real-time socket updates for this queue room
  useQueueSocket(ticketStatus?.entry.queueId, () => {
    fetchStatus();
  });

  const handleCancelTicket = () => {
    if (!ticketId) return;

    if (ticketStatus?.status === 'SERVING') {
      Alert.alert(
        'Cancellation Not Permitted',
        'Your ticket is currently being served at the counter by staff and cannot be cancelled.',
        [{ text: 'Understood' }]
      );
      return;
    }

    Alert.alert(
      'Cancel Queue Ticket',
      'Are you sure you want to cancel your ticket? You will lose your current place in line.',
      [
        { text: 'Keep Ticket', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await queueApi.cancelTicket(ticketId);
              await fetchStatus();
              Alert.alert('Ticket Cancelled', 'Your queue entry has been successfully cancelled.');
            } catch (err: any) {
              Alert.alert('Cancellation Error', err.message || 'Unable to cancel ticket.');
            } finally {
              setCancelling(false);
            }
          },
        },
      ]
    );
  };

  const handleHideTicket = () => {
    if (!ticketId) return;
    Alert.alert(
      'Remove from History',
      'Hide this ticket from your activity history? The authoritative queue record remains intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await queueApi.hideTicket(ticketId);
              Alert.alert('Removed', 'This ticket has been hidden from your history.', [
                {
                  text: 'OK',
                  onPress: () => {
                    if (router.canGoBack()) {
                      router.back();
                    } else {
                      router.replace('/(customer)/history');
                    }
                  },
                },
              ]);
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Unable to hide ticket.');
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: EntryStatus) => {
    switch (status) {
      case 'CALLING':
        return COLORS.statusCalling;
      case 'SERVING':
        return COLORS.statusServing;
      case 'COMPLETED':
        return COLORS.statusCompleted;
      case 'CANCELLED':
      case 'SKIPPED':
      case 'ABSENT':
        return COLORS.statusCancelled;
      case 'WAITING':
      default:
        return COLORS.statusWaiting;
    }
  };

  const isTerminal =
    ticketStatus?.status === 'COMPLETED' ||
    ticketStatus?.status === 'CANCELLED' ||
    ticketStatus?.status === 'SKIPPED' ||
    ticketStatus?.status === 'ABSENT';

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <MobileHeader
        title="Live Ticket Tracker"
        subtitle={ticketStatus?.ticketNumber ? `Ticket #${ticketStatus.ticketNumber}` : 'Real-time Queue Monitor'}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace('/(customer)/home');
          }
        }}
      />

      <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Connecting to real-time queue engine...</Text>
          </View>
        ) : !ticketStatus ? (
          <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <AlertTriangle color={colors.danger} size={40} style={{ marginBottom: 12 }} />
            <Text style={[styles.errorTitle, { color: colors.danger }]}>Ticket Not Found</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              This ticket may have expired, been completed, or is no longer available.
            </Text>
            <TouchableOpacity style={[styles.returnBtn, { backgroundColor: colors.primary }]} onPress={() => router.replace('/(customer)/home')}>
              <Text style={styles.returnBtnText}>Return to Customer Home</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.bodyContent}>
            {/* Calling Alert Banner */}
            {ticketStatus.status === 'CALLING' && (
              <View style={styles.callingBanner}>
                <Bell color="#ffffff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.callingBannerText}>
                  YOU ARE BEING CALLED! Please proceed to the service counter immediately.
                </Text>
              </View>
            )}

            {/* Serving Banner */}
            {ticketStatus.status === 'SERVING' && (
              <View style={styles.servingBanner}>
                <CheckCircle2 color="#ffffff" size={20} style={{ marginRight: 8 }} />
                <Text style={styles.servingBannerText}>Now being served at the counter.</Text>
              </View>
            )}

            {/* Remote Travel & Arrival Guidance Card (Part 21) */}
            {!isTerminal && (
              <View style={[styles.guidanceCard, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)', borderColor: colors.surfaceBorder }]}>
                <View style={styles.guidanceHeader}>
                  <MapPin color={colors.primary} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.guidanceBadge, { color: colors.primary }]}>
                    {ticketStatus.peopleAhead === 0 && ticketStatus.status === 'WAITING'
                      ? 'YOU ARE NEXT'
                      : ticketStatus.peopleAhead <= 3 && ticketStatus.status === 'WAITING'
                      ? 'ALMOST YOUR TURN'
                      : 'TRAVELING TO BRANCH'}
                  </Text>
                </View>
                <Text style={[styles.guidanceText, { color: colors.text }]}>
                  {ticketStatus.peopleAhead === 0 && ticketStatus.status === 'WAITING'
                    ? `Please proceed to the ${ticketStatus.branchName} counter now. You are next in line!`
                    : ticketStatus.peopleAhead <= 3 && ticketStatus.status === 'WAITING'
                    ? `You have ${ticketStatus.peopleAhead} customer${ticketStatus.peopleAhead === 1 ? '' : 's'} ahead of you. If you are travelling, please head to the branch now.`
                    : `You have ${ticketStatus.peopleAhead} customers ahead (~${ticketStatus.estimatedWaitTimeMinutes} mins estimated wait). You can continue travelling to ${ticketStatus.branchName} at your pace.`}
                </Text>
              </View>
            )}

            {/* Service Transfer Banner */}
            {ticketStatus.originalServiceName && (
              <View
                style={[
                  styles.transferCard,
                  {
                    backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)',
                    borderColor: 'rgba(245, 158, 11, 0.35)',
                  },
                ]}
              >
                <View style={styles.transferHeader}>
                  <RefreshCw color="#f59e0b" size={15} style={{ marginRight: 6 }} />
                  <Text style={styles.transferHeading}>SERVICE TRANSFERRED</Text>
                </View>
                <Text style={[styles.transferBody, { color: colors.text }]}>
                  Your ticket was transferred from{' '}
                  <Text style={{ fontWeight: '700' }}>{ticketStatus.originalServiceName}</Text> to{' '}
                  <Text style={{ fontWeight: '700' }}>{ticketStatus.serviceName}</Text>.
                </Text>
                {ticketStatus.transferReason && (
                  <Text style={[styles.transferReason, { color: colors.textSecondary }]}>
                    Reason: {ticketStatus.transferReason}
                  </Text>
                )}
                <Text style={[styles.transferSub, { color: colors.textMuted }]}>
                  Your queue position and waiting time have been recalculated for {ticketStatus.serviceName}.
                </Text>
              </View>
            )}

            {/* Ticket Hero Card */}
            <View style={[styles.ticketCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <View style={styles.ticketTopRow}>
                <View style={styles.badgeRow}>
                  <Ticket color={colors.primary} size={16} style={{ marginRight: 4 }} />
                  <Text style={[styles.badgeText, { color: colors.primary }]}>YOUR DIGITAL TICKET</Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  {ticketStatus.priority === 'PRIORITY' && (
                    <View style={styles.priorityBadge}>
                      <Sparkles color="#8b5cf6" size={12} style={{ marginRight: 3 }} />
                      <Text style={styles.priorityBadgeText}>PRIORITY</Text>
                    </View>
                  )}
                  {ticketStatus.priority === 'APPOINTMENT' && (
                    <View style={styles.appointmentBadge}>
                      <Calendar color="#3b82f6" size={12} style={{ marginRight: 3 }} />
                      <Text style={styles.appointmentBadgeText}>APPT</Text>
                    </View>
                  )}
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: `${getStatusColor(ticketStatus.status)}25` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusBadgeText,
                        { color: getStatusColor(ticketStatus.status) },
                      ]}
                    >
                      {ticketStatus.status}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.ticketNumberContainer}>
                <Text style={[styles.ticketNumber, { color: colors.primary }]}>{ticketStatus.ticketNumber}</Text>
                <Text style={[styles.serviceTitle, { color: colors.text }]}>{ticketStatus.serviceName}</Text>
                <Text style={[styles.branchTitle, { color: colors.textSecondary }]}>{ticketStatus.branchName}</Text>
                {ticketStatus.branchLocation && (
                  <View style={styles.locationRow}>
                    <MapPin color={colors.textMuted} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.locationTitle, { color: colors.textMuted }]}>{ticketStatus.branchLocation}</Text>
                  </View>
                )}
              </View>

              {/* Metrics Grid */}
              {!isTerminal && (
                <View style={[styles.metricsGrid, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                  <View style={styles.metricBlock}>
                    <Text style={[styles.metricBigVal, { color: colors.text }]}>{ticketStatus.peopleAhead}</Text>
                    <Text style={[styles.metricDesc, { color: colors.textMuted }]}>People Ahead</Text>
                  </View>

                  <View style={[styles.metricSeparator, { backgroundColor: colors.surfaceBorder }]} />

                  <View style={styles.metricBlock}>
                    <Text style={[styles.metricBigVal, { color: colors.text }]}>
                      ~{ticketStatus.estimatedWaitTimeMinutes}m
                    </Text>
                    <Text style={[styles.metricDesc, { color: colors.textMuted }]}>Est. Wait Time</Text>
                  </View>
                </View>
              )}

              {/* Now Serving Indicator */}
              {ticketStatus.nowServing && (
                <View style={[styles.nowServingRow, { borderTopColor: colors.surfaceBorder }]}>
                  <Clock color={colors.primary} size={15} style={{ marginRight: 6 }} />
                  <Text style={[styles.nowServingLabel, { color: colors.textSecondary }]}>
                    Currently at Counter:{' '}
                    <Text style={[styles.nowServingHighlight, { color: colors.text }]}>
                      {ticketStatus.nowServing.ticketNumber || `#${ticketStatus.nowServing.position}`}
                    </Text>
                  </Text>
                </View>
              )}
            </View>

            {/* Notification & Callback Preference Switcher */}
            {!isTerminal && (
              <View
                style={[
                  styles.prefCard,
                  { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                ]}
              >
                <View style={styles.prefHeaderRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Bell color={colors.primary} size={15} style={{ marginRight: 6 }} />
                    <Text style={[styles.prefCardTitle, { color: colors.text }]}>Alert & Callback Preference</Text>
                  </View>
                  {updatingPref && <ActivityIndicator size="small" color={colors.primary} />}
                </View>

                <View style={styles.prefChipsRow}>
                  {[
                    { key: 'STANDARD', label: 'All Alerts' },
                    { key: 'NOTIFY_APPROACHING_5', label: '5 Ahead' },
                    { key: 'NOTIFY_APPROACHING_2', label: '2 Ahead' },
                    { key: 'NOTIFY_CALLED_ONLY', label: 'Called Only' },
                  ].map((p) => {
                    const isSelected =
                      (ticketStatus.notificationPreference || 'STANDARD') === p.key;
                    return (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.prefChip,
                          {
                            backgroundColor: colors.surfaceLight,
                            borderColor: colors.surfaceBorder,
                          },
                          isSelected && {
                            backgroundColor: isDark
                              ? 'rgba(59, 130, 246, 0.2)'
                              : 'rgba(37, 99, 235, 0.1)',
                            borderColor: colors.primary,
                          },
                        ]}
                        onPress={() => handleUpdatePref(p.key as NotificationPreference)}
                        disabled={updatingPref}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.prefChipText,
                            {
                              color: isSelected ? colors.primary : colors.textMuted,
                              fontWeight: isSelected ? '700' : '500',
                            },
                          ]}
                        >
                          {p.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Ticket Lifecycle Timestamps Card */}
            <View style={[styles.lifecycleCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Text style={[styles.lifecycleHeading, { color: colors.textSecondary }]}>TICKET LIFECYCLE & TIMESTAMPS</Text>

              <View style={styles.lifecycleRow}>
                <Text style={[styles.lifecycleLabel, { color: colors.textMuted }]}>Joined Queue</Text>
                <Text style={[styles.lifecycleVal, { color: colors.text }]}>
                  {ticketStatus.entry?.joinedAt
                    ? new Date(ticketStatus.entry.joinedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })
                    : '—'}
                </Text>
              </View>

              {ticketStatus.entry?.calledAt && (
                <>
                  <View style={[styles.lifecycleDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.lifecycleRow}>
                    <Text style={[styles.lifecycleLabel, { color: colors.textMuted }]}>Called to Counter</Text>
                    <Text style={[styles.lifecycleVal, { color: colors.text }]}>
                      {new Date(ticketStatus.entry.calledAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {ticketStatus.entry?.servingAt && (
                <>
                  <View style={[styles.lifecycleDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.lifecycleRow}>
                    <Text style={[styles.lifecycleLabel, { color: colors.textMuted }]}>Service Began</Text>
                    <Text style={[styles.lifecycleVal, { color: colors.text }]}>
                      {new Date(ticketStatus.entry.servingAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {ticketStatus.entry?.completedAt && (
                <>
                  <View style={[styles.lifecycleDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.lifecycleRow}>
                    <Text style={[styles.lifecycleLabel, { color: colors.textMuted }]}>Service Completed</Text>
                    <Text style={[styles.lifecycleVal, { color: colors.success }]}>
                      {new Date(ticketStatus.entry.completedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {(ticketStatus.entry?.cancelledAt || ticketStatus.cancelledAt) && (
                <>
                  <View style={[styles.lifecycleDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={styles.lifecycleRow}>
                    <Text style={[styles.lifecycleLabel, { color: colors.textMuted }]}>Cancelled At</Text>
                    <Text style={[styles.lifecycleVal, { color: colors.danger }]}>
                      {new Date(ticketStatus.entry?.cancelledAt || ticketStatus.cancelledAt!).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </Text>
                  </View>
                </>
              )}

              {(ticketStatus.entry?.cancellationReason || ticketStatus.cancellationReason) && (
                <>
                  <View style={[styles.lifecycleDivider, { backgroundColor: colors.surfaceBorder }]} />
                  <View style={{ marginTop: 4 }}>
                    <Text style={[styles.lifecycleLabel, { color: colors.danger }]}>Cancellation Reason</Text>
                    <Text style={[styles.lifecycleReasonText, { color: colors.text }]}>
                      {ticketStatus.entry?.cancellationReason || ticketStatus.cancellationReason}
                    </Text>
                    {(ticketStatus.entry?.cancelledBy || ticketStatus.cancelledBy) && (
                      <Text style={[styles.lifecycleSubText, { color: colors.textMuted }]}>
                        Cancelled by: {ticketStatus.entry?.cancelledBy || ticketStatus.cancelledBy}
                      </Text>
                    )}
                  </View>
                </>
              )}
            </View>

            {/* Live Sync Status Pill */}
            {!isTerminal && (
              <View style={styles.syncRow}>
                <View style={[styles.pulsingDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.syncText, { color: colors.textMuted }]}>Live Queue Engine Connected • Real-time Sync Active</Text>
              </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actionsRow}>
              {!isTerminal && (
                <TouchableOpacity
                  style={[styles.contactStaffBtn, { backgroundColor: colors.surface, borderColor: colors.primary }]}
                  onPress={() => setContactModalVisible(true)}
                  activeOpacity={0.8}
                >
                  <MessageSquare color={colors.primary} size={18} style={{ marginRight: 6 }} />
                  <Text style={[styles.contactStaffBtnText, { color: colors.primary }]}>
                    Contact Service Counter Staff
                  </Text>
                </TouchableOpacity>
              )}

              {!isTerminal && ticketStatus.status === 'SERVING' && (
                <View style={[styles.cancelBtn, styles.cancelBtnLocked, { borderColor: colors.surfaceBorder }]}>
                  <Lock color={colors.textMuted} size={18} style={{ marginRight: 6 }} />
                  <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>
                    In Service — Cancellation Locked
                  </Text>
                </View>
              )}

              {!isTerminal && ticketStatus.status !== 'SERVING' && (
                <TouchableOpacity
                  style={[styles.cancelBtn, cancelling && { opacity: 0.5 }]}
                  onPress={handleCancelTicket}
                  disabled={cancelling}
                  activeOpacity={0.8}
                >
                  <XCircle color={colors.danger} size={18} style={{ marginRight: 6 }} />
                  <Text style={[styles.cancelBtnText, { color: colors.danger }]}>
                    {cancelling ? 'Cancelling...' : 'Cancel Ticket'}
                  </Text>
                </TouchableOpacity>
              )}

              {isTerminal && (
                <TouchableOpacity
                  style={[styles.hideBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={handleHideTicket}
                  activeOpacity={0.8}
                >
                  <EyeOff color={colors.textMuted} size={16} style={{ marginRight: 6 }} />
                  <Text style={[styles.hideBtnText, { color: colors.textMuted }]}>
                    Remove from My History
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.homeBtn, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => router.replace('/(customer)/home')}
                activeOpacity={0.8}
              >
                <Text style={[styles.homeBtnText, { color: colors.textSecondary }]}>Return to Customer Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScreenWrapper>

      {/* Customer Contact Counter Staff Modal */}
      <CustomerContactModal
        visible={contactModalVisible}
        onClose={() => setContactModalVisible(false)}
        queueEntryId={ticketId}
        serviceTitle={`${ticketStatus?.serviceName || 'Queue'} Service Counter`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  contactStaffBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    marginBottom: SPACING.sm,
  },
  contactStaffBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  bodyContent: {
    paddingTop: SPACING.md,
  },
  centerLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: SPACING.md,
  },
  errorCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginTop: SPACING.xl,
  },
  errorTitle: {
    color: COLORS.danger,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  returnBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
  },
  returnBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  callingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.statusCalling,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    shadowColor: COLORS.statusCalling,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  callingBannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
    lineHeight: 18,
  },
  servingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.statusServing,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  servingBannerText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '800',
    flex: 1,
  },
  guidanceCard: {
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
    borderColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  guidanceBadge: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  guidanceText: {
    color: COLORS.text,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  ticketCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  ticketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  ticketNumberContainer: {
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  ticketNumber: {
    color: COLORS.white,
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -1,
  },
  serviceTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  branchTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationTitle: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  metricsGrid: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'space-around',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  metricBlock: {
    alignItems: 'center',
    flex: 1,
  },
  metricBigVal: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '900',
  },
  metricDesc: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  metricSeparator: {
    width: 1,
    height: 32,
    backgroundColor: COLORS.surfaceBorder,
  },
  nowServingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  nowServingLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  nowServingHighlight: {
    color: COLORS.white,
    fontWeight: '800',
  },
  syncRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: SPACING.md,
  },
  pulsingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  syncText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsRow: {
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.25)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  cancelBtnLocked: {
    backgroundColor: 'rgba(100, 116, 139, 0.1)',
    borderColor: COLORS.surfaceBorder,
  },
  cancelBtnText: {
    color: COLORS.danger,
    fontSize: 14,
    fontWeight: '800',
  },
  homeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  homeBtnText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  hideBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  hideBtnText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lifecycleCard: {
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  lifecycleHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
  },
  lifecycleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
  },
  lifecycleLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  lifecycleVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  lifecycleDivider: {
    height: 1,
    marginVertical: SPACING.xs + 2,
  },
  lifecycleReasonText: {
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  lifecycleSubText: {
    fontSize: 11,
    marginTop: 2,
  },
  transferCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  transferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  transferHeading: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  transferBody: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 4,
  },
  transferReason: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  transferSub: {
    fontSize: 11,
    lineHeight: 15,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  priorityBadgeText: {
    color: '#8b5cf6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  appointmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.35)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  appointmentBadgeText: {
    color: '#3b82f6',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  prefCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
  },
  prefHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  prefCardTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  prefChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  prefChip: {
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
  },
  prefChipText: {
    fontSize: 11,
  },
});
