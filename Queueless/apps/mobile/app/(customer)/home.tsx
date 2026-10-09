import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import queueApi from '../../src/api/queueApi';
import organizationApi from '../../src/api/organizationApi';
import appointmentApi from '../../src/api/appointmentApi';
import { CustomerTicketStatus, Organization, Appointment } from '../../src/types';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useCustomerNotifications } from '../../src/hooks/useCustomerNotifications';
import {
  Users,
  Calendar,
  QrCode,
  ArrowRight,
  Clock,
  Building2,
  MapPin,
  Search,
  Sparkles,
  Ticket,
  Bell,
  Settings,
} from 'lucide-react-native';
import { useRealtimeClock } from '../../src/hooks/useRealtimeClock';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { unreadCount } = useCustomerNotifications();
  const { timeString, dateString } = useRealtimeClock();

  const [activeTicket, setActiveTicket] = useState<CustomerTicketStatus | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [fetchError, setFetchError] = useState<string | null>(null);

  const fetchData = async () => {
    setFetchError(null);
    try {
      const [ticketRes, orgsRes, appointmentsRes] = await Promise.allSettled([
        queueApi.getMyActiveTicket(),
        organizationApi.getPublicOrganizations(),
        appointmentApi.getMyAppointments(),
      ]);

      if (ticketRes.status === 'fulfilled') {
        setActiveTicket(ticketRes.value);
      }
      if (orgsRes.status === 'fulfilled') {
        setOrganizations(orgsRes.value);
      } else {
        setFetchError('Could not load organizations. Pull down or tap to retry.');
      }
      if (appointmentsRes.status === 'fulfilled' && appointmentsRes.value.length > 0) {
        const upcoming = appointmentsRes.value.find((a) => a.status === 'CONFIRMED' || a.status === 'PENDING');
        setUpcomingAppointment(upcoming || null);
      }
    } catch (err: any) {
      console.warn('Error fetching home data:', err);
      setFetchError(err?.message || 'Failed to connect to QueueLess servers.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.branches?.some((b) => b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q))
    );
  });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {/* Greeting Header */}
      <View style={styles.greetingHeader}>
        <View style={{ flex: 1, marginRight: SPACING.sm }}>
          <Text style={[styles.greetingText, { color: colors.text }]}>Hello, {user?.fullName || 'Customer'} 👋</Text>
          <Text style={[styles.subtitleText, { color: colors.textSecondary }]}>What would you like to do today?</Text>
        </View>
        <View style={styles.headerActionGroup}>
          <TouchableOpacity
            style={[styles.headerIconButton, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
            onPress={() => router.push('/notifications')}
            activeOpacity={0.7}
          >
            <Bell color={unreadCount > 0 ? colors.primary : colors.textSecondary} size={20} />
            {unreadCount > 0 && (
              <View style={[styles.notifBadge, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
                <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Real-Time Live Clock Widget */}
      <View style={[styles.clockCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <View style={styles.clockLeft}>
          <View style={[styles.livePulseDot, { backgroundColor: colors.success }]} />
          <Clock color={colors.accent} size={15} style={{ marginRight: 6 }} />
          <Text style={[styles.clockTimeText, { color: colors.text }]}>{timeString}</Text>
        </View>
        <Text style={[styles.clockDateText, { color: colors.textMuted }]}>{dateString}</Text>
      </View>

      {/* Quick Action Grid */}
      <View style={styles.actionGrid}>
        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/queue/join')}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconBadge}>
            <Users color="#ffffff" size={22} />
          </View>
          <Text style={styles.actionTitleWhite}>Join a Queue</Text>
          <Text style={styles.actionDescWhite}>Get a digital ticket</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionCard, { backgroundColor: colors.secondary }]}
          onPress={() => router.push('/appointment/book')}
          activeOpacity={0.85}
        >
          <View style={styles.actionIconBadge}>
            <Calendar color="#ffffff" size={22} />
          </View>
          <Text style={styles.actionTitleWhite}>Book Appointment</Text>
          <Text style={styles.actionDescWhite}>Reserve a slot</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionCard,
            {
              backgroundColor: colors.surface,
              borderColor: colors.surfaceBorder,
              borderWidth: 1,
            },
          ]}
          onPress={() => router.push('/scan')}
          activeOpacity={0.85}
        >
          <View style={[styles.actionIconBadge, { backgroundColor: isDark ? 'rgba(6, 182, 212, 0.2)' : 'rgba(2, 132, 199, 0.12)' }]}>
            <QrCode color={colors.accent} size={22} />
          </View>
          <Text style={[styles.actionTitle, { color: colors.text }]}>Scan QR Code</Text>
          <Text style={[styles.actionDesc, { color: colors.textSecondary }]}>Instant desk check-in</Text>
        </TouchableOpacity>
      </View>

      {/* Active Queue Section */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Active Queue</Text>
      </View>

      {loading ? (
        <View style={[styles.loadingCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <ActivityIndicator color={colors.primary} size="small" />
        </View>
      ) : activeTicket ? (
        <View style={[styles.activeTicketCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <View style={styles.ticketHeader}>
            <View style={[styles.ticketBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : 'rgba(37, 99, 235, 0.1)' }]}>
              <Ticket color={colors.primary} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.ticketBadgeText, { color: colors.primary }]}>ACTIVE TICKET</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: 'rgba(16, 185, 129, 0.18)' }]}>
              <Text style={[styles.statusPillText, { color: colors.success }]}>{activeTicket.status}</Text>
            </View>
          </View>

          <View style={styles.ticketMainRow}>
            <View>
              <Text style={[styles.ticketNumber, { color: colors.text }]}>{activeTicket.ticketNumber}</Text>
              <Text style={[styles.serviceName, { color: colors.text }]}>{activeTicket.serviceName}</Text>
              <Text style={[styles.branchName, { color: colors.textSecondary }]}>{activeTicket.branchName}</Text>
            </View>
            <View style={[styles.ticketMetrics, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder, borderWidth: 1 }]}>
              <View style={styles.metricItem}>
                <Text style={[styles.metricValue, { color: colors.text }]}>{activeTicket.peopleAhead}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>people ahead</Text>
              </View>
              <View style={[styles.metricDivider, { backgroundColor: colors.surfaceBorder }]} />
              <View style={styles.metricItem}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={[styles.metricValue, { color: colors.text }]}>~{activeTicket.estimatedWaitTimeMinutes}m</Text>
                  {activeTicket.isDynamic && (
                    <View style={styles.dynamicChip}>
                      <Text style={styles.dynamicChipText}>DYN</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>
                  {activeTicket.isDynamic && activeTicket.dynamicPaceMinutes
                    ? `~${activeTicket.dynamicPaceMinutes}m pace`
                    : 'est. wait'}
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.viewTicketButton, { backgroundColor: colors.primary }]}
            onPress={() => router.push(`/queue/${activeTicket.entry.id}`)}
          >
            <Text style={styles.viewTicketText}>View Live Ticket Details</Text>
            <ArrowRight color="#ffffff" size={16} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.emptyTicketCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Users color={colors.textMuted} size={32} style={{ marginBottom: 8 }} />
          <Text style={[styles.emptyTicketTitle, { color: colors.text }]}>No Active Queue</Text>
          <Text style={[styles.emptyTicketSubtitle, { color: colors.textSecondary }]}>
            You are not currently waiting in any branch queue.
          </Text>
          <TouchableOpacity
            style={[styles.emptyJoinButton, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
            onPress={() => router.push('/queue/join')}
          >
            <Text style={[styles.emptyJoinButtonText, { color: colors.primary }]}>Join a Queue Now</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Upcoming Appointment Section (if any) */}
      {upcomingAppointment && (
        <View style={styles.appointmentSection}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Upcoming Appointment</Text>
          </View>
          <View style={[styles.appointmentCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.appDateBadge, { backgroundColor: colors.surfaceLight }]}>
              <Calendar color={colors.primary} size={18} />
              <Text style={[styles.appDateText, { color: colors.text }]}>
                {upcomingAppointment.scheduledTime
                  ? new Date(upcomingAppointment.scheduledTime).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Remote'}
              </Text>
              <Text style={[styles.appTimeText, { color: colors.primary }]}>
                {upcomingAppointment.scheduledTime
                  ? new Date(upcomingAppointment.scheduledTime).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Assistance'}
              </Text>
            </View>
            <View style={styles.appInfo}>
              <Text style={[styles.appServiceName, { color: colors.text }]}>{upcomingAppointment.service?.name}</Text>
              <Text style={[styles.appBranchName, { color: colors.textSecondary }]}>{upcomingAppointment.branch?.name}</Text>
              <TouchableOpacity
                style={styles.appViewLink}
                onPress={() => router.push(`/appointment/${upcomingAppointment.id}`)}
              >
                <Text style={[styles.appViewLinkText, { color: colors.primary }]}>Manage Appointment →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Error banner if network/server issue */}
      {fetchError && (
        <View style={[styles.errorBanner, { backgroundColor: 'rgba(239, 68, 68, 0.12)', borderColor: 'rgba(239, 68, 68, 0.3)' }]}>
          <Text style={[styles.errorBannerText, { color: colors.danger }]}>{fetchError}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]} onPress={fetchData}>
            <Text style={[styles.retryButtonText, { color: colors.danger }]}>Tap to Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Organization Discovery */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Discover Services & Branches</Text>
      </View>

      {/* Search Input */}
      <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
        <Search color={colors.textMuted} size={18} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search organizations or locations..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Organization Cards */}
      <View style={styles.orgList}>
        {filteredOrgs.length === 0 ? (
          <View style={styles.emptySearchCard}>
            <Text style={[styles.emptySearchText, { color: colors.textMuted }]}>No organizations found matching "{searchQuery}"</Text>
          </View>
        ) : (
          filteredOrgs.map((org) => (
            <TouchableOpacity
              key={org.id}
              style={[styles.orgCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
              onPress={() => router.push(`/organization/${org.id}`)}
              activeOpacity={0.8}
            >
              <View style={styles.orgHeader}>
                <View style={[styles.orgIconBadge, { backgroundColor: colors.surfaceLight }]}>
                  <Building2 color={colors.primary} size={20} />
                </View>
                <View style={styles.orgTitleWrapper}>
                  <Text style={[styles.orgName, { color: colors.text }]}>{org.name}</Text>
                  <Text style={[styles.orgType, { color: colors.textSecondary }]}>{org.type} • {org.branches?.length || 0} active branches</Text>
                </View>
                <ArrowRight color={colors.textMuted} size={18} />
              </View>

              {/* Sample Branches */}
              {org.branches && org.branches.length > 0 && (
                <View style={styles.branchPillsRow}>
                  {org.branches.slice(0, 3).map((branch) => (
                    <View key={branch.id} style={[styles.branchPill, { backgroundColor: colors.surfaceLight }]}>
                      <MapPin color={colors.textMuted} size={11} style={{ marginRight: 3 }} />
                      <Text style={[styles.branchPillText, { color: colors.textSecondary }]}>{branch.name}</Text>
                    </View>
                  ))}
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
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
  greetingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
    paddingTop: SPACING.xs,
  },
  greetingText: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitleText: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  scanIconButton: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  notifBadgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '900',
  },
  actionGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    justifyContent: 'space-between',
    minHeight: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  actionIconBadge: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  actionDesc: {
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  actionTitleWhite: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 16,
  },
  actionDescWhite: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 10,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionHeader: {
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  loadingCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  activeTicketCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ticketBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  ticketBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusPill: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  statusPillText: {
    color: COLORS.statusServing,
    fontSize: 11,
    fontWeight: '800',
  },
  ticketMainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  ticketNumber: {
    color: COLORS.white,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  serviceName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  branchName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  ticketMetrics: {
    flexDirection: 'row',
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
  },
  metricItem: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  metricValue: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  metricLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: COLORS.surfaceBorder,
  },
  viewTicketButton: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.md,
    height: 44,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewTicketText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '700',
  },
  emptyTicketCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  emptyTicketTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  emptyTicketSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  emptyJoinButton: {
    backgroundColor: COLORS.surfaceLight,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  emptyJoinButtonText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  appointmentSection: {
    marginBottom: SPACING.xl,
  },
  appointmentCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
  },
  appDateBadge: {
    backgroundColor: COLORS.surfaceLight,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    minWidth: 70,
    marginRight: SPACING.md,
  },
  appDateText: {
    color: COLORS.text,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  appTimeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
  },
  appInfo: {
    flex: 1,
  },
  appServiceName: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: '700',
  },
  appBranchName: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  appViewLink: {
    marginTop: 6,
  },
  appViewLinkText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '700',
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
    height: 44,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  orgList: {
    gap: SPACING.sm,
  },
  orgCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  orgHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  orgIconBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  orgTitleWrapper: {
    flex: 1,
  },
  orgName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
  },
  orgType: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  branchPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: SPACING.sm,
    paddingTop: SPACING.xs,
  },
  branchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: RADIUS.sm,
  },
  branchPillText: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  emptySearchCard: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  emptySearchText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  errorBannerText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginRight: SPACING.sm,
  },
  retryButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.sm,
  },
  retryButtonText: {
    color: COLORS.danger,
    fontSize: 11,
    fontWeight: '700',
  },
  clockCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  clockLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 6,
  },
  clockTimeText: {
    color: COLORS.text,
    fontSize: 13,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    letterSpacing: 0.3,
  },
  clockDateText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  dynamicChip: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginLeft: 4,
  },
  dynamicChipText: {
    color: COLORS.statusServing,
    fontSize: 9,
    fontWeight: '900',
  },
});
