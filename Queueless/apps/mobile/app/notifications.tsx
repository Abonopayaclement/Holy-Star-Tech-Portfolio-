import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/context/ThemeContext';
import { SPACING, RADIUS } from '../src/constants/theme';
import { useCustomerNotifications } from '../src/hooks/useCustomerNotifications';
import { MobileNotification } from '../src/api/notificationApi';
import {
  ArrowLeft,
  Bell,
  Ticket,
  AlertCircle,
  CheckCircle2,
  Calendar,
  CheckCheck,
  ChevronRight,
  Clock,
} from 'lucide-react-native';

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  const {
    notifications,
    loading,
    refreshNotifications,
    markAsRead,
    markAllAsRead,
  } = useCustomerNotifications();

  const [activeFilter, setActiveFilter] = useState<'ALL' | 'QUEUE' | 'APPOINTMENT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    refreshNotifications();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshNotifications();
    setRefreshing(false);
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeFilter === 'QUEUE') return n.type.startsWith('QUEUE');
    if (activeFilter === 'APPOINTMENT') return n.type.startsWith('APPOINTMENT');
    return true;
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUEUE_CALLED':
        return <AlertCircle color="#d97706" size={20} />;
      case 'QUEUE_MILESTONE_2':
      case 'QUEUE_MILESTONE_5':
      case 'QUEUE_JOINED':
        return <Ticket color={colors.primary} size={20} />;
      case 'APPOINTMENT_APPROVED':
      case 'APPOINTMENT_COMPLETED':
      case 'QUEUE_COMPLETED':
        return <CheckCircle2 color={colors.success} size={20} />;
      case 'APPOINTMENT_REJECTED':
      case 'QUEUE_CANCELLED':
        return <AlertCircle color={colors.danger} size={20} />;
      default:
        return <Calendar color={colors.primary} size={20} />;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return { label: 'URGENT', bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.35)' };
      case 'ACTION_REQUIRED':
      case 'IMPORTANT':
        return { label: 'IMPORTANT', bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.35)' };
      case 'NORMAL':
        return { label: 'NORMAL', bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.35)' };
      case 'LOW':
      case 'INFO':
        return { label: 'INFO', bg: 'rgba(100, 116, 139, 0.12)', text: '#64748b', border: 'rgba(100, 116, 139, 0.25)' };
      default:
        return null;
    }
  };

  const formatTimeAgo = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return '';
    }
  };

  const handleNotificationPress = async (item: MobileNotification) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }

    // Deep-link to ticket or appointment safely
    let meta: any = item.metadata;
    if (typeof meta === 'string') {
      try {
        meta = JSON.parse(meta);
      } catch {
        meta = {};
      }
    }

    const ticketId = meta?.ticketId || (item.entityType === 'QUEUE_ENTRY' ? item.entityId : null);
    const appointmentId = meta?.appointmentId || (item.entityType === 'APPOINTMENT' ? item.entityId : null);

    if (ticketId) {
      router.push(`/queue/${ticketId}` as any);
    } else if (appointmentId) {
      router.push(`/appointment/${appointmentId}` as any);
    }
  };

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
          style={[styles.iconButton, { backgroundColor: colors.surfaceLight }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={colors.text} size={20} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Notification Center</Text>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: colors.surfaceLight }]}
          onPress={markAllAsRead}
          activeOpacity={0.7}
        >
          <CheckCheck color={colors.primary} size={18} />
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        {(['ALL', 'QUEUE', 'APPOINTMENT'] as const).map((filter) => {
          const isSelected = activeFilter === filter;
          const label = filter === 'ALL' ? 'All' : filter === 'QUEUE' ? 'Queues' : 'Appointments';
          return (
            <TouchableOpacity
              key={filter}
              style={[
                styles.filterTab,
                isSelected && [styles.filterTabActive, { borderBottomColor: colors.primary }],
              ]}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                style={[
                  styles.filterTabText,
                  { color: isSelected ? colors.primary : colors.textMuted },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Content List */}
      {loading && notifications.length === 0 ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textMuted }]}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredNotifications}
          keyExtractor={(item: MobileNotification) => item.id}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.centerBox}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surfaceLight }]}>
                <Bell color={colors.textMuted} size={36} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No Notifications</Text>
              <Text style={[styles.emptyDesc, { color: colors.textMuted }]}>
                {activeFilter === 'ALL'
                  ? 'When your queue position changes or your remote appointment is updated, alerts will appear here.'
                  : `No ${activeFilter.toLowerCase()} notifications at this time.`}
              </Text>
            </View>
          }
          renderItem={({ item }: { item: MobileNotification }) => {
            const priorityBadge = getPriorityBadge(item.priority);
            return (
              <TouchableOpacity
                style={[
                  styles.notificationCard,
                  {
                    backgroundColor: item.isRead
                      ? colors.surface
                      : isDark
                      ? 'rgba(59, 130, 246, 0.12)'
                      : 'rgba(37, 99, 235, 0.05)',
                    borderColor: item.isRead ? colors.surfaceBorder : colors.primary,
                  },
                ]}
                onPress={() => handleNotificationPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.cardTopRow}>
                  <View style={[styles.notifIconCircle, { backgroundColor: colors.surfaceLight }]}>
                    {getNotificationIcon(item.type)}
                  </View>
                  <View style={styles.cardHeaderWrap}>
                    <View style={styles.titleRow}>
                      <Text
                        style={[
                          styles.notifTitle,
                          { color: colors.text, fontWeight: item.isRead ? '700' : '900' },
                        ]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      {!item.isRead && (
                        <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />
                      )}
                    </View>
                    <View style={styles.timeRow}>
                      <Clock color={colors.textMuted} size={11} style={{ marginRight: 4 }} />
                      <Text style={[styles.timeText, { color: colors.textMuted }]}>
                        {formatTimeAgo(item.createdAt)}
                      </Text>
                      {priorityBadge && (
                        <View
                          style={[
                            styles.priorityBadge,
                            {
                              backgroundColor: priorityBadge.bg,
                              borderColor: priorityBadge.border,
                            },
                          ]}
                        >
                          <Text style={[styles.priorityBadgeText, { color: priorityBadge.text }]}>
                            {priorityBadge.label}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                </View>

                <Text style={[styles.notifMessage, { color: colors.textSecondary }]}>
                  {item.message}
                </Text>

                {item.metadata && (
                  <View style={styles.cardActionRow}>
                    <Text style={[styles.viewDetailsText, { color: colors.primary }]}>View details</Text>
                    <ChevronRight color={colors.primary} size={14} />
                  </View>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    paddingHorizontal: SPACING.md,
  },
  filterTab: {
    paddingVertical: SPACING.sm + 4,
    marginRight: SPACING.lg,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  filterTabActive: {
    borderBottomWidth: 2,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    padding: SPACING.md,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  emptyIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: SPACING.xs,
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  notificationCard: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  notifIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm + 4,
  },
  cardHeaderWrap: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notifTitle: {
    fontSize: 15,
    flex: 1,
    marginRight: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  notifMessage: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: SPACING.xs,
  },
  cardActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
  },
  viewDetailsText: {
    fontSize: 12,
    fontWeight: '700',
    marginRight: 2,
  },
  priorityBadge: {
    marginLeft: 8,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.sm,
    borderWidth: 1,
  },
  priorityBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
