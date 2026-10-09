import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import organizationApi from '../../src/api/organizationApi';
import { Organization, Branch } from '../../src/types';
import { COLORS, SPACING, RADIUS } from '../../src/constants/theme';
import { useTheme } from '../../src/context/ThemeContext';
import { Building2, MapPin, Clock, ArrowRight, ShieldCheck } from 'lucide-react-native';
import { ScreenWrapper, MobileHeader } from '../../src/components';

export default function OrganizationDetailsScreen() {
  const { organizationId } = useLocalSearchParams<{ organizationId: string }>();
  const { colors, isDark } = useTheme();
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        setLoading(true);
        const allOrgs = await organizationApi.getPublicOrganizations();
        const found = allOrgs.find((o) => o.id === organizationId);
        if (found) {
          setOrg(found);
        } else {
          setError('Organization not found.');
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load organization details.');
      } finally {
        setLoading(false);
      }
    };

    if (organizationId) fetchOrg();
  }, [organizationId]);

  return (
    <ScreenWrapper safeTop={false} safeBottom={true}>
      <MobileHeader title={org?.name || 'Organization Details'} showBack />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={styles.content}>
      {loading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading organization...</Text>
        </View>
      ) : error || !org ? (
        <View style={[styles.errorCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
          <Text style={[styles.errorTitle, { color: colors.danger }]}>Error</Text>
          <Text style={[styles.errorSubtitle, { color: colors.textSecondary }]}>{error || 'Organization not found'}</Text>
        </View>
      ) : (
        <>
          {/* Organization Header */}
          <View style={[styles.headerCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}>
            <View style={[styles.iconCircle, { backgroundColor: colors.surfaceLight }]}>
              <Building2 color={colors.primary} size={32} />
            </View>
            <Text style={[styles.orgName, { color: colors.text }]}>{org.name}</Text>
            <View style={[styles.typeBadge, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(37, 99, 235, 0.08)' }]}>
              <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{org.type}</Text>
            </View>
            {org.description && (
              <Text style={[styles.orgDescription, { color: colors.textSecondary }]}>{org.description}</Text>
            )}
          </View>

          {/* Branches Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Select a Branch</Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {org.branches?.length || 0} active branches available
            </Text>
          </View>

          <View style={styles.branchList}>
            {org.branches?.map((branch: Branch) => (
              <TouchableOpacity
                key={branch.id}
                style={[styles.branchCard, { backgroundColor: colors.surface, borderColor: colors.surfaceBorder }]}
                onPress={() => router.push(`/branch/${branch.id}`)}
                activeOpacity={0.8}
              >
                <View style={styles.branchMain}>
                  <Text style={[styles.branchName, { color: colors.text }]}>{branch.name}</Text>
                  <View style={styles.metaRow}>
                    <MapPin color={colors.textMuted} size={13} style={{ marginRight: 4 }} />
                    <Text style={[styles.metaText, { color: colors.textSecondary }]}>{branch.location}</Text>
                  </View>
                  {branch.operatingHours && (
                    <View style={styles.metaRow}>
                      <Clock color={colors.textMuted} size={13} style={{ marginRight: 4 }} />
                      <Text style={[styles.metaText, { color: colors.textSecondary }]}>{branch.operatingHours}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.branchArrow}>
                  <ArrowRight color={colors.primary} size={18} />
                </View>
              </TouchableOpacity>
            ))}
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
  errorCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    borderRadius: RADIUS.xl,
    alignItems: 'center',
  },
  errorTitle: {
    color: COLORS.danger,
    fontSize: 16,
    fontWeight: '700',
  },
  errorSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    marginTop: 4,
  },
  headerCard: {
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.xl,
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  orgName: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  typeBadge: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
    marginTop: 6,
  },
  typeBadgeText: {
    color: COLORS.primaryLight,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  orgDescription: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    marginTop: SPACING.md,
    lineHeight: 18,
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
  branchList: {
    gap: SPACING.sm,
  },
  branchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  },
  branchMain: {
    flex: 1,
  },
  branchName: {
    color: COLORS.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metaText: {
    color: COLORS.textSecondary,
    fontSize: 12,
  },
  branchArrow: {
    paddingLeft: SPACING.sm,
  },
});
