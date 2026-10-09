import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import organizationApi from '../../src/api/organizationApi';
import queueApi from '../../src/api/queueApi';
import { Organization, Branch, Service, NotificationPreference } from '../../src/types';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { useAuth } from '../../src/hooks/useAuth';
import { ScreenWrapper, MobileHeader } from '../../src/components';
import {
  Building2,
  MapPin,
  Tag,
  Check,
  Users,
  ArrowLeft,
  ArrowRight,
  Search,
  RefreshCw,
  Clock,
  AlertCircle,
  Sparkles,
  Bell,
} from 'lucide-react-native';

export default function JoinQueueWizard() {
  const { colors, isDark } = useTheme();
  const { user, token } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [notificationPref, setNotificationPref] = useState<NotificationPreference>('STANDARD');
  const [loading, setLoading] = useState(true);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();

  const loadOrgs = useCallback(async () => {
    setLoading(true);
    setErrorState(null);
    try {
      const data = await organizationApi.getPublicOrganizations();
      setOrganizations(data || []);
    } catch (err: any) {
      console.warn('Error loading public organizations:', err);
      setErrorState(
        err.message || 'Unable to connect to QueueLess. Check your internet connection.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadOrgs();
  }, [loadOrgs]);

  const handleOrgSelect = (org: Organization) => {
    setSelectedOrg(org);
    setSelectedBranch(null);
    setSelectedService(null);
    setStep(2);
  };

  const handleBranchSelect = (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedService(null);
    setStep(3);
  };

  const handleConfirmJoin = async () => {
    if (!selectedService) return;
    const targetQueue = selectedService.queues?.find((q) => q.status === 'OPEN') || selectedService.queues?.[0];
    if (!targetQueue || targetQueue.status !== 'OPEN') {
      Alert.alert(
        'Queue Currently Closed',
        `${selectedService.name} is not accepting new customers right now. Existing customers are still being served. Please try again later.`
      );
      return;
    }

    setSubmitting(true);
    try {
      const entry = await queueApi.joinQueue(targetQueue.id, {
        isRemote: true,
        notificationPreference: notificationPref,
      });
      router.replace(`/queue/${entry.id}`);
    } catch (err: any) {
      Alert.alert('Unable to Join Queue', err.response?.data?.error || err.message || 'Unable to join queue.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredOrgs = organizations.filter((org) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      org.name.toLowerCase().includes(q) ||
      org.type?.toLowerCase().includes(q) ||
      org.branches?.some((b) => b.name.toLowerCase().includes(q) || b.location.toLowerCase().includes(q))
    );
  });

  const getHeaderTitle = () => {
    switch (step) {
      case 1:
        return 'Choose Organization';
      case 2:
        return 'Choose Branch';
      case 3:
        return 'Choose Service';
    }
  };

  const handleHeaderBack = () => {
    if (step === 3) {
      setStep(2);
    } else if (step === 2) {
      setStep(1);
    } else {
      router.back();
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <MobileHeader
        title={getHeaderTitle()}
        subtitle={`Step ${step} of 3 — Remote Queue Joining`}
        onBack={handleHeaderBack}
      />

      {/* Step Indicator Bar */}
      <View style={[styles.stepBar, { backgroundColor: colors.surface, borderBottomColor: colors.surfaceBorder }]}>
        <View style={[styles.stepDot, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }, step >= 1 && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={[styles.stepNum, { color: step >= 1 ? '#ffffff' : colors.textMuted }]}>1</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: colors.surfaceBorder }, step >= 2 && { backgroundColor: colors.primary }]} />
        <View style={[styles.stepDot, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }, step >= 2 && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={[styles.stepNum, { color: step >= 2 ? '#ffffff' : colors.textMuted }]}>2</Text>
        </View>
        <View style={[styles.stepLine, { backgroundColor: colors.surfaceBorder }, step >= 3 && { backgroundColor: colors.primary }]} />
        <View style={[styles.stepDot, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }, step >= 3 && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
          <Text style={[styles.stepNum, { color: step >= 3 ? '#ffffff' : colors.textMuted }]}>3</Text>
        </View>
      </View>

      <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
        {/* Loading State */}
        {loading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingTitle, { color: colors.text }]}>Connecting to QueueLess...</Text>
            <Text style={[styles.loadingSub, { color: colors.textSecondary }]}>Fetching available institutions and service desks</Text>
          </View>
        ) : errorState ? (
          /* Network Error State */
          <View style={styles.centerBox}>
            <View style={styles.errorIconCircle}>
              <AlertCircle color={colors.danger} size={36} />
            </View>
            <Text style={[styles.errorTitle, { color: colors.text }]}>Unable to connect to QueueLess</Text>
            <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>
              Check your internet connection or Wi-Fi network and try again.
            </Text>
            <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadOrgs} activeOpacity={0.8}>
              <RefreshCw color="#ffffff" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.retryButtonText}>Retry Connection</Text>
            </TouchableOpacity>
          </View>
        ) : step === 1 ? (
          /* Step 1: Organizations */
          <View style={styles.stepContent}>
            {/* Search Box */}
            <View style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
              <Search color={colors.textMuted} size={18} style={{ marginRight: 8 }} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search organizations or locations..."
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Text style={[styles.clearText, { color: colors.primary }]}>Clear</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {filteredOrgs.length === 0 ? (
              <View style={styles.centerBox}>
                <Building2 color={colors.textMuted} size={42} style={{ marginBottom: 12 }} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>No organizations are currently available.</Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                  {searchQuery
                    ? 'No institutions matched your search query.'
                    : 'Registered banks and service centers will appear here.'}
                </Text>
                <TouchableOpacity style={[styles.retryButton, { backgroundColor: colors.primary }]} onPress={loadOrgs}>
                  <Text style={styles.retryButtonText}>Try Again</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.list}>
                {filteredOrgs.map((org) => (
                  <TouchableOpacity
                    key={org.id}
                    style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                    onPress={() => handleOrgSelect(org)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
                        <Building2 color={colors.primary} size={22} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{org.name}</Text>
                        <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                          {org.type} • {org.branches?.length || 0} active branch
                          {(org.branches?.length || 0) === 1 ? '' : 'es'}
                        </Text>
                      </View>
                      <ArrowRight color={colors.textMuted} size={18} />
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        ) : step === 2 ? (
          /* Step 2: Branch */
          <View style={styles.stepContent}>
            <TouchableOpacity style={styles.backBreadcrumb} onPress={() => setStep(1)}>
              <ArrowLeft color={colors.primary} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.backBreadcrumbText, { color: colors.primary }]}>Back to {selectedOrg?.name}</Text>
            </TouchableOpacity>

            <Text style={[styles.stepHeaderTitle, { color: colors.text }]}>Choose Branch Location</Text>
            <Text style={[styles.stepHeaderSub, { color: colors.textSecondary }]}>Select your preferred branch for service</Text>

            <View style={styles.list}>
              {selectedOrg?.branches?.map((branch) => (
                <TouchableOpacity
                  key={branch.id}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                  onPress={() => handleBranchSelect(branch)}
                  activeOpacity={0.8}
                >
                  <View style={styles.cardHeader}>
                    <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
                      <MapPin color={colors.primary} size={22} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.text }]}>{branch.name}</Text>
                      <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>{branch.location}</Text>
                      {branch.operatingHours ? (
                        <View style={styles.hoursRow}>
                          <Clock color={colors.textMuted} size={12} style={{ marginRight: 4 }} />
                          <Text style={[styles.hoursText, { color: colors.textMuted }]}>{branch.operatingHours}</Text>
                        </View>
                      ) : null}
                    </View>
                    <ArrowRight color={colors.textMuted} size={18} />
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          /* Step 3: Service & Remote Join */
          <View style={styles.stepContent}>
            <TouchableOpacity style={styles.backBreadcrumb} onPress={() => setStep(2)}>
              <ArrowLeft color={colors.primary} size={14} style={{ marginRight: 4 }} />
              <Text style={[styles.backBreadcrumbText, { color: colors.primary }]}>Back to {selectedBranch?.name}</Text>
            </TouchableOpacity>

            <Text style={[styles.stepHeaderTitle, { color: colors.text }]}>Select Service Desk</Text>
            <Text style={[styles.stepHeaderSub, { color: colors.textSecondary }]}>Choose the department or counter to join</Text>

            <View style={styles.list}>
              {selectedBranch?.services?.map((service) => {
                const isSelected = selectedService?.id === service.id;
                const hasOpenQueue = service.queues && service.queues.length > 0;
                const isRemoteAllowed = service.allowRemoteJoin !== false;

                return (
                  <TouchableOpacity
                    key={service.id}
                    style={[
                      styles.card,
                      { backgroundColor: colors.surface, borderColor: colors.surfaceBorder },
                      isSelected && {
                        borderColor: colors.primary,
                        backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                      },
                    ]}
                    onPress={() => setSelectedService(service)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.cardHeader}>
                      <View style={[styles.iconCircle, { backgroundColor: isSelected ? colors.primary : isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
                        <Tag color={isSelected ? '#ffffff' : colors.primary} size={20} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: colors.text }]}>{service.name}</Text>
                        <Text style={[styles.cardMeta, { color: colors.textSecondary }]}>
                          ~{service.duration || 15} mins per customer
                        </Text>
                        <View style={styles.tagRow}>
                          {hasOpenQueue ? (
                            <Text style={styles.badgeOpen}>QUEUE OPEN</Text>
                          ) : (
                            <Text style={styles.badgeClosed}>QUEUE CLOSED</Text>
                          )}
                          {isRemoteAllowed ? (
                            <Text style={[styles.badgeRemote, { color: colors.primary }]}>Remote Join Ready</Text>
                          ) : (
                            <Text style={[styles.badgeOnSite, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)', color: colors.textMuted }]}>On-Site Only</Text>
                          )}
                        </View>
                      </View>
                      {isSelected ? (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Check color="#ffffff" size={14} />
                        </View>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Remote Join Confirmation Action */}
            {selectedService ? (
              <View style={[styles.confirmBox, { borderTopColor: colors.surfaceBorder }]}>
                {selectedService.queues?.some((q) => q.status === 'OPEN') ? (
                  <>
                    <View style={[styles.remoteCallout, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
                      <Sparkles color={colors.primary} size={16} style={{ marginRight: 6 }} />
                      <Text style={[styles.remoteCalloutText, { color: colors.primary }]}>
                        You are joining remotely. Your place will be reserved immediately.
                      </Text>
                    </View>

                    {/* Notification Preference Selector */}
                    <View style={[styles.prefBox, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                      <View style={styles.prefHeader}>
                        <Bell color={colors.primary} size={16} style={{ marginRight: 6 }} />
                        <Text style={[styles.prefTitle, { color: colors.text }]}>Notification & Callback Preference</Text>
                      </View>
                      <Text style={[styles.prefSub, { color: colors.textSecondary }]}>
                        Choose when QueueLess should notify you while traveling or waiting:
                      </Text>

                      <View style={styles.prefGrid}>
                        {[
                          { key: 'STANDARD', label: 'All Updates', desc: 'Milestone & status updates' },
                          { key: 'NOTIFY_APPROACHING_5', label: '5 People Ahead', desc: 'Alert when ~5 remain' },
                          { key: 'NOTIFY_APPROACHING_2', label: '2 People Ahead', desc: 'Alert when ~2 remain' },
                          { key: 'NOTIFY_CALLED_ONLY', label: 'Called Only', desc: 'Alert only when called' },
                        ].map((item) => {
                          const isChosen = notificationPref === item.key;
                          return (
                            <TouchableOpacity
                              key={item.key}
                              style={[
                                styles.prefOption,
                                { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder },
                                isChosen && {
                                  borderColor: colors.primary,
                                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)',
                                },
                              ]}
                              onPress={() => setNotificationPref(item.key as NotificationPreference)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.prefOptionTop}>
                                <Text style={[styles.prefOptionLabel, { color: isChosen ? colors.primary : colors.text }]}>
                                  {item.label}
                                </Text>
                                {isChosen && (
                                  <View style={[styles.prefCheck, { backgroundColor: colors.primary }]}>
                                    <Check color="#ffffff" size={11} />
                                  </View>
                                )}
                              </View>
                              <Text style={[styles.prefOptionDesc, { color: colors.textMuted }]}>
                                {item.desc}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </>
                ) : (
                  <View style={styles.closedCallout}>
                    <AlertCircle color={colors.danger} size={16} style={{ marginRight: 6, marginTop: 1 }} />
                    <Text style={styles.closedCalloutText}>
                      Queue Closed: This service is currently unavailable for new queue entries.
                    </Text>
                  </View>
                )}

                <TouchableOpacity
                  style={[
                    styles.joinBtn,
                    { backgroundColor: colors.primary },
                    (!selectedService.queues?.some((q) => q.status === 'OPEN') || submitting) && styles.joinBtnDisabled,
                  ]}
                  onPress={handleConfirmJoin}
                  disabled={!selectedService.queues?.some((q) => q.status === 'OPEN') || submitting}
                  activeOpacity={0.85}
                >
                  {submitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <>
                      <Users color="#ffffff" size={20} style={{ marginRight: 8 }} />
                      <Text style={styles.joinBtnText}>
                        {selectedService.queues?.some((q) => q.status === 'OPEN')
                          ? `Join ${selectedService.name} Queue Now`
                          : 'Queue Currently Closed'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : null}
          </View>
        )}
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stepBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  stepDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  stepDotActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  stepNum: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: '800',
  },
  stepLine: {
    width: 36,
    height: 2,
    backgroundColor: COLORS.surfaceBorder,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: COLORS.primaryLight,
  },
  stepContent: {
    paddingTop: SPACING.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
    marginBottom: SPACING.md,
  },
  searchInput: {
    flex: 1,
    color: COLORS.text,
    fontSize: 14,
  },
  clearText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: 'bold',
  },
  list: {
    gap: SPACING.sm,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.surfaceBorder,
  },
  cardSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: 'rgba(37, 99, 235, 0.08)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  cardTitle: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardMeta: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 2,
  },
  hoursRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  hoursText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  badgeOpen: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeClosed: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.danger,
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeRemote: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeOnSite: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.textMuted,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBreadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  backBreadcrumbText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '700',
  },
  stepHeaderTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  stepHeaderSub: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  confirmBox: {
    marginTop: SPACING.lg,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.surfaceBorder,
  },
  remoteCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  remoteCalloutText: {
    color: COLORS.primaryLight,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  closedCallout: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  closedCalloutText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  joinBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
    minHeight: 52,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  joinBtnDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.surfaceBorder,
    shadowOpacity: 0,
    elevation: 0,
  },
  joinBtnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  centerBox: {
    paddingVertical: SPACING.xxl * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  loadingTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: SPACING.md,
  },
  loadingSub: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
    textAlign: 'center',
  },
  errorIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  errorTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 6,
  },
  errorSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.lg,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.sm + 2,
    paddingHorizontal: SPACING.lg,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 4,
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  prefBox: {
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  prefHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  prefTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  prefSub: {
    fontSize: 12,
    marginBottom: SPACING.sm,
    lineHeight: 16,
  },
  prefGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  prefOption: {
    width: '48.5%',
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  prefOptionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  prefOptionLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  prefCheck: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefOptionDesc: {
    fontSize: 10,
    lineHeight: 13,
  },
});
