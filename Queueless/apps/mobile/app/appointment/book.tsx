import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import organizationApi from '../../src/api/organizationApi';
import appointmentApi from '../../src/api/appointmentApi';
import { Organization, Branch, Service, AppointmentCategory } from '../../src/types';
import { SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import {
  ShieldAlert,
  Smartphone,
  CreditCard,
  UserCheck,
  FileText,
  HelpCircle,
  Building2,
  MapPin,
  Check,
  Send,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';
import { ScreenWrapper, MobileHeader } from '../../src/components';

const getCategoryIcon = (name: string) => {
  const lower = name.toLowerCase();
  if (
    lower.includes('pin') ||
    lower.includes('card') ||
    lower.includes('pay') ||
    lower.includes('money') ||
    lower.includes('wallet') ||
    lower.includes('deposit') ||
    lower.includes('fee')
  ) {
    return CreditCard;
  }
  if (
    lower.includes('sim') ||
    lower.includes('phone') ||
    lower.includes('mobile') ||
    lower.includes('telecom') ||
    lower.includes('app')
  ) {
    return Smartphone;
  }
  if (
    lower.includes('fraud') ||
    lower.includes('freeze') ||
    lower.includes('dispute') ||
    lower.includes('security') ||
    lower.includes('lost') ||
    lower.includes('urgent')
  ) {
    return ShieldAlert;
  }
  if (
    lower.includes('kyc') ||
    lower.includes('id') ||
    lower.includes('biometric') ||
    lower.includes('verification') ||
    lower.includes('user') ||
    lower.includes('profile')
  ) {
    return UserCheck;
  }
  if (
    lower.includes('statement') ||
    lower.includes('record') ||
    lower.includes('document') ||
    lower.includes('cert') ||
    lower.includes('licens') ||
    lower.includes('audit')
  ) {
    return FileText;
  }
  return HelpCircle;
};

export default function BookRemoteAppointmentScreen() {
  const params = useLocalSearchParams<{ branchId?: string; serviceId?: string }>();
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [categories, setCategories] = useState<AppointmentCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AppointmentCategory | null>(null);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Initial load: Fetch public organizations
  useEffect(() => {
    const initData = async () => {
      try {
        setLoading(true);
        const orgs = await organizationApi.getPublicOrganizations();
        setOrganizations(orgs);

        // If branchId was passed in params, resolve it
        if (params.branchId) {
          const branch = await organizationApi.getBranch(params.branchId);
          const parentOrg = orgs.find((o) => o.id === branch.organizationId);
          if (parentOrg) {
            setSelectedOrg(parentOrg);
            setBranches(parentOrg.branches || [branch]);
          }
          setSelectedBranch(branch);
          setServices(branch.services || []);

          if (params.serviceId) {
            const svc = branch.services?.find((s) => s.id === params.serviceId);
            if (svc) {
              handleSelectService(svc, branch.id);
            }
          } else if (branch.services && branch.services.length > 0) {
            handleSelectService(branch.services[0], branch.id);
          }
        }
      } catch (err: any) {
        Alert.alert('Error', 'Failed to load organization details for appointment.');
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [params.branchId, params.serviceId]);

  // When selectedOrg changes, update branches
  const handleSelectOrg = (org: Organization) => {
    setSelectedOrg(org);
    setSelectedBranch(null);
    setServices([]);
    setSelectedService(null);
    setCategories([]);
    setSelectedCategory(null);
    setBranches(org.branches || []);
  };

  // When selectedBranch changes, load full branch data with services
  const handleSelectBranch = async (branch: Branch) => {
    setSelectedBranch(branch);
    setSelectedService(null);
    setCategories([]);
    setSelectedCategory(null);
    try {
      const fullBranch = await organizationApi.getBranch(branch.id);
      setSelectedBranch(fullBranch);
      setServices(fullBranch.services || []);
      if (fullBranch.services && fullBranch.services.length > 0) {
        handleSelectService(fullBranch.services[0], fullBranch.id);
      }
    } catch {
      setServices(branch.services || []);
    }
  };

  // When service changes, load categories
  const handleSelectService = async (service: Service, bId?: string) => {
    setSelectedService(service);
    setSelectedCategory(null);
    const branchIdToUse = bId || selectedBranch?.id;
    if (!branchIdToUse) return;

    setCategoriesLoading(true);
    try {
      const fetched = await appointmentApi.getCategories(branchIdToUse, service.id);
      setCategories(fetched);
      if (fetched.length > 0) {
        setSelectedCategory(fetched[0]);
      }
    } catch (err) {
      console.warn('Failed to load categories', err);
    } finally {
      setCategoriesLoading(false);
    }
  };

  const handleSubmitRequest = async () => {
    if (!selectedOrg) {
      Alert.alert('Organization Required', 'Please choose an organization first.');
      return;
    }
    if (!selectedBranch) {
      Alert.alert('Branch Required', 'Please select a branch to handle your appointment.');
      return;
    }
    if (!selectedService) {
      Alert.alert('Service Desk Required', 'Please select a service desk.');
      return;
    }
    if (!selectedCategory && categories.length > 0) {
      Alert.alert('Category Required', 'Please select an appointment issue category.');
      return;
    }
    if (!notes.trim()) {
      Alert.alert('Explanation Required', 'Please explain your problem or reason for the appointment.');
      return;
    }

    setSubmitting(true);
    try {
      const appt = await appointmentApi.createRemoteRequest({
        branchId: selectedBranch.id,
        serviceId: selectedService.id,
        categoryId: selectedCategory?.id,
        problemType: selectedCategory?.name || selectedService.name,
        notes: notes.trim(),
      });

      Alert.alert(
        'Appointment Request Sent',
        'Your request has been submitted to staff for review. You will receive an alert once staff reviews your problem and assigns a fee.',
        [
          {
            text: 'View Appointment Status',
            onPress: () => router.replace(`/appointment/${appt.id}`),
          },
        ]
      );
    } catch (err: any) {
      Alert.alert('Submission Error', err.response?.data?.error || err.message || 'Failed to submit appointment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.outerContainer, { backgroundColor: colors.background }]}>
      <MobileHeader
        title="Book Appointment"
        subtitle="Step-by-step organization, branch & category booking"
        onBack={() => router.back()}
      />

      <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
        {loading ? (
          <View style={styles.centerLoading}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading organizations...</Text>
          </View>
        ) : (
          <View style={styles.content}>
            {/* Explanatory Banner */}
            <View style={[styles.infoBanner, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.12)' : 'rgba(37, 99, 235, 0.08)', borderColor: colors.primary }]}>
              <Sparkles color={colors.primary} size={20} style={{ marginRight: 10, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.infoBannerTitle, { color: colors.text }]}>Remote Problem Resolution</Text>
                <Text style={[styles.infoBannerDesc, { color: colors.textSecondary }]}>
                  Follow the steps below to select your organization, branch, service, and explain your problem.
                </Text>
              </View>
            </View>

            {/* STEP 1: CHOOSE ORGANIZATION */}
            <View style={styles.stepSection}>
              <View style={styles.stepHeaderRow}>
                <View style={[styles.stepNumberBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.stepNumberText}>1</Text>
                </View>
                <Text style={[styles.stepTitle, { color: colors.text }]}>Choose Organization</Text>
                {selectedOrg && (
                  <View style={[styles.selectedPill, { backgroundColor: colors.success + '20' }]}>
                    <Check color={colors.success} size={12} style={{ marginRight: 4 }} />
                    <Text style={[styles.selectedPillText, { color: colors.success }]}>Selected</Text>
                  </View>
                )}
              </View>

              <View style={styles.optionsContainer}>
                {organizations.map((org) => {
                  const isSelected = selectedOrg?.id === org.id;
                  return (
                    <TouchableOpacity
                      key={org.id}
                      style={[
                        styles.orgOptionCard,
                        {
                          backgroundColor: colors.surface,
                          borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                          borderWidth: isSelected ? 2 : 1,
                        },
                      ]}
                      onPress={() => handleSelectOrg(org)}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.orgIconWrap, { backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceLight }]}>
                        <Building2 color={isSelected ? colors.primary : colors.textSecondary} size={22} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.orgName, { color: colors.text }]}>{org.name}</Text>
                        <Text style={[styles.orgType, { color: colors.textMuted }]}>
                          {org.type || 'Enterprise Partner'} • {org.branches?.length || 0} branches
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                          <Check color="#fff" size={14} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* STEP 2: CHOOSE BRANCH (if org selected) */}
            {selectedOrg && (
              <View style={styles.stepSection}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: selectedBranch ? colors.primary : colors.textMuted }]}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Choose Branch</Text>
                  {selectedBranch && (
                    <View style={[styles.selectedPill, { backgroundColor: colors.success + '20' }]}>
                      <Check color={colors.success} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.selectedPillText, { color: colors.success }]}>Selected</Text>
                    </View>
                  )}
                </View>

                {branches.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No branches found for this organization.</Text>
                  </View>
                ) : (
                  <View style={styles.optionsContainer}>
                    {branches.map((b) => {
                      const isSelected = selectedBranch?.id === b.id;
                      return (
                        <TouchableOpacity
                          key={b.id}
                          style={[
                            styles.branchOptionCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                              borderWidth: isSelected ? 2 : 1,
                            },
                          ]}
                          onPress={() => handleSelectBranch(b)}
                          activeOpacity={0.7}
                        >
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.branchName, { color: colors.text }]}>{b.name}</Text>
                            <View style={styles.branchLocationRow}>
                              <MapPin color={colors.textMuted} size={12} style={{ marginRight: 4 }} />
                              <Text style={[styles.branchLocation, { color: colors.textMuted }]}>{b.location}</Text>
                            </View>
                          </View>
                          {isSelected && (
                            <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                              <Check color="#fff" size={14} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* STEP 3: CHOOSE SERVICE (if branch selected) */}
            {selectedBranch && (
              <View style={styles.stepSection}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: selectedService ? colors.primary : colors.textMuted }]}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Choose Service</Text>
                  {selectedService && (
                    <View style={[styles.selectedPill, { backgroundColor: colors.success + '20' }]}>
                      <Check color={colors.success} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.selectedPillText, { color: colors.success }]}>Selected</Text>
                    </View>
                  )}
                </View>

                {services.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No services listed for this branch.</Text>
                  </View>
                ) : (
                  <View style={styles.chipsContainer}>
                    {services.map((svc) => {
                      const isSelected = selectedService?.id === svc.id;
                      return (
                        <TouchableOpacity
                          key={svc.id}
                          style={[
                            styles.chip,
                            {
                              backgroundColor: isSelected ? colors.primary : colors.surface,
                              borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                            },
                          ]}
                          onPress={() => handleSelectService(svc)}
                          activeOpacity={0.8}
                        >
                          <Sparkles color={isSelected ? '#fff' : colors.textSecondary} size={14} style={{ marginRight: 6 }} />
                          <Text style={[styles.chipText, { color: isSelected ? '#fff' : colors.text }]}>
                            {svc.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* STEP 4: CHOOSE APPOINTMENT CATEGORY */}
            {selectedService && (
              <View style={styles.stepSection}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: selectedCategory ? colors.primary : colors.textMuted }]}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Choose Appointment Category</Text>
                  {selectedCategory && (
                    <View style={[styles.selectedPill, { backgroundColor: colors.success + '20' }]}>
                      <Check color={colors.success} size={12} style={{ marginRight: 4 }} />
                      <Text style={[styles.selectedPillText, { color: colors.success }]}>Selected</Text>
                    </View>
                  )}
                </View>

                {categoriesLoading ? (
                  <ActivityIndicator color={colors.primary} size="small" style={{ marginVertical: 12 }} />
                ) : categories.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                      Standard appointment category will be used for this service.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.categoryGrid}>
                    {categories.map((cat) => {
                      const isSelected = selectedCategory?.id === cat.id;
                      const IconComp = getCategoryIcon(cat.name);
                      return (
                        <TouchableOpacity
                          key={cat.id}
                          style={[
                            styles.categoryCard,
                            {
                              backgroundColor: colors.surface,
                              borderColor: isSelected ? colors.primary : colors.surfaceBorder,
                              borderWidth: isSelected ? 2 : 1,
                            },
                          ]}
                          onPress={() => setSelectedCategory(cat)}
                          activeOpacity={0.7}
                        >
                          <View style={[styles.categoryIconWrap, { backgroundColor: isSelected ? colors.primary + '15' : colors.surfaceLight }]}>
                            <IconComp color={isSelected ? colors.primary : colors.textSecondary} size={20} />
                          </View>
                          <Text style={[styles.categoryName, { color: colors.text }]} numberOfLines={2}>
                            {cat.name}
                          </Text>
                          {isSelected && (
                            <View style={[styles.categoryCheckBadge, { backgroundColor: colors.primary }]}>
                              <Check color="#fff" size={10} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {/* STEP 5: EXPLAIN YOUR PROBLEM */}
            {selectedService && (
              <View style={styles.stepSection}>
                <View style={styles.stepHeaderRow}>
                  <View style={[styles.stepNumberBadge, { backgroundColor: notes.trim() ? colors.primary : colors.textMuted }]}>
                    <Text style={styles.stepNumberText}>5</Text>
                  </View>
                  <Text style={[styles.stepTitle, { color: colors.text }]}>Explain Your Problem</Text>
                </View>
                <Text style={[styles.stepSubtext, { color: colors.textSecondary }]}>
                  Provide details about your issue regarding{' '}
                  <Text style={{ fontWeight: '700', color: colors.text }}>
                    {selectedCategory?.name || selectedService.name}
                  </Text>{' '}
                  so staff can review and set your fee.
                </Text>

                <View style={[styles.notesCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
                  <View style={styles.notesHeaderRow}>
                    <FileText color={colors.primary} size={16} style={{ marginRight: 6 }} />
                    <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Problem Details & Notes *</Text>
                  </View>
                  <TextInput
                    style={[styles.notesInput, { color: colors.text, borderColor: colors.surfaceBorder }]}
                    placeholder="Describe your issue, symptoms, or what assistance you need from staff..."
                    placeholderTextColor={colors.textMuted}
                    multiline
                    numberOfLines={4}
                    value={notes}
                    onChangeText={setNotes}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.charCount, { color: colors.textMuted }]}>{notes.length} characters</Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    { backgroundColor: colors.primary },
                    (!selectedOrg || !selectedBranch || !selectedService || !notes.trim() || submitting) && { opacity: 0.6 },
                  ]}
                  onPress={handleSubmitRequest}
                  disabled={!selectedOrg || !selectedBranch || !selectedService || !notes.trim() || submitting}
                  activeOpacity={0.8}
                >
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Send color="#fff" size={18} style={{ marginRight: 8 }} />
                      <Text style={styles.submitButtonText}>Send Appointment Request</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScreenWrapper>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl + 40,
  },
  centerLoading: {
    padding: SPACING.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 14,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginBottom: SPACING.lg,
  },
  infoBannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 3,
  },
  infoBannerDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  stepSection: {
    marginBottom: SPACING.xl,
  },
  stepHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  stepNumberBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '800',
    flex: 1,
  },
  selectedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
  },
  selectedPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  stepSubtext: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: SPACING.sm,
  },
  optionsContainer: {
    gap: SPACING.sm,
  },
  orgOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  orgIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  orgName: {
    fontSize: 15,
    fontWeight: '700',
  },
  orgType: {
    fontSize: 12,
    marginTop: 2,
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  branchOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
  },
  branchName: {
    fontSize: 14,
    fontWeight: '700',
  },
  branchLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  branchLocation: {
    fontSize: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    width: '48%',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    position: 'relative',
  },
  categoryIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 17,
  },
  categoryCheckBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notesCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    marginTop: 4,
  },
  notesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    minHeight: 100,
    fontSize: 14,
    lineHeight: 20,
  },
  charCount: {
    fontSize: 11,
    textAlign: 'right',
    marginTop: 4,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: RADIUS.xl,
    marginTop: SPACING.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCard: {
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
  },
  emptyText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
});
