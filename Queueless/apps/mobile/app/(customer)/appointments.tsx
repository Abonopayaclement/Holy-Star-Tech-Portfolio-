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
import appointmentApi from '../../src/api/appointmentApi';
import { Appointment } from '../../src/types';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { Calendar, Clock, MapPin, Plus, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react-native';

export default function AppointmentsScreen() {
  const { colors, isDark } = useTheme();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();

  const fetchAppointments = async () => {
    try {
      const data = await appointmentApi.getMyAppointments();
      setAppointments(data);
    } catch (err) {
      console.warn('Failed to load appointments', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PAID':
        return { color: colors.success, bg: 'rgba(16, 185, 129, 0.15)' };
      case 'PENDING':
      case 'APPROVED':
        return { color: colors.warning, bg: 'rgba(245, 158, 11, 0.15)' };
      case 'CANCELLED':
      case 'REJECTED':
        return { color: colors.danger, bg: 'rgba(239, 68, 68, 0.15)' };
      case 'COMPLETED':
      default:
        return { color: colors.textMuted, bg: 'rgba(100, 116, 139, 0.15)' };
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={[styles.title, { color: colors.text }]}>My Appointments</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Scheduled branch desk bookings</Text>
        </View>
        <TouchableOpacity
          style={[styles.bookButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/appointment/book')}
        >
          <Plus color="#ffffff" size={16} style={{ marginRight: 4 }} />
          <Text style={styles.bookButtonText}>Book Slot</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your appointments...</Text>
        </View>
      ) : appointments.length === 0 ? (
        <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Calendar color={colors.textMuted} size={48} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Appointments Booked</Text>
          <Text style={[styles.emptyDesc, { color: colors.textSecondary }]}>
            Reserve an appointment in advance to guarantee your spot at the branch without waiting.
          </Text>
          <TouchableOpacity
            style={[styles.bookSlotCTA, { backgroundColor: colors.primary }]}
            onPress={() => router.push('/appointment/book')}
          >
            <Text style={styles.bookSlotCTAText}>Book Your First Appointment</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.list}>
          {appointments.map((item) => {
            const statusStyle = getStatusStyle(item.status);
            const dateObj = item.scheduledTime ? new Date(item.scheduledTime) : new Date();
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => router.push(`/appointment/${item.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={[styles.dateBlock, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.dateMonth, { color: colors.primary }]}>
                      {dateObj.toLocaleDateString([], { month: 'short' }).toUpperCase()}
                    </Text>
                    <Text style={[styles.dateDay, { color: colors.text }]}>{dateObj.getDate()}</Text>
                  </View>

                  <View style={styles.cardInfo}>
                    <View style={styles.statusRow}>
                      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
                        <Text style={[styles.statusText, { color: statusStyle.color }]}>
                          {item.status}
                        </Text>
                      </View>
                      <Text style={[styles.timeText, { color: colors.textMuted }]}>
                        <Clock size={12} color={colors.textMuted} />{' '}
                        {dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>

                    <Text style={[styles.serviceName, { color: colors.text }]}>{item.service?.name}</Text>
                    <Text style={[styles.branchName, { color: colors.textSecondary }]}>
                      <MapPin size={11} color={colors.textMuted} /> {item.branch?.name}
                    </Text>
                  </View>

                  <ChevronRight color={colors.textMuted} size={18} />
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
  },
  bookButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
  bookSlotCTA: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  bookSlotCTAText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateBlock: {
    width: 52,
    height: 54,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  dateMonth: {
    fontSize: 10,
    fontWeight: '800',
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '900',
  },
  cardInfo: {
    flex: 1,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  timeText: {
    fontSize: 11,
  },
  serviceName: {
    fontSize: 15,
    fontWeight: '700',
  },
  branchName: {
    fontSize: 12,
    marginTop: 2,
  },
});
