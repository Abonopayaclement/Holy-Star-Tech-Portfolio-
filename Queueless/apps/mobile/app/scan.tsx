import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { parseQRCode } from '../src/utils/qrParser';
import organizationApi from '../src/api/organizationApi';
import { COLORS, SPACING, RADIUS } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';
import { ScreenWrapper, MobileHeader } from '../src/components';
import {
  QrCode,
  Camera,
  AlertCircle,
  ArrowRight,
  X,
  Keyboard,
  Sparkles,
  Building2,
  Calendar,
  Users,
} from 'lucide-react-native';

export default function QRScannerScreen() {
  const { colors, isDark } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [resolvedResult, setResolvedResult] = useState<any | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    if (scanned || resolving) return;
    setScanned(true);
    await processQrString(data);
  };

  const processQrString = async (rawString: string) => {
    const parsed = parseQRCode(rawString);
    if (!parsed.isValid || !parsed.token) {
      Alert.alert(
        'Invalid QR Code',
        'This QR code is not recognized as a valid QueueLess branch or service code.',
        [{ text: 'Scan Again', onPress: () => setScanned(false) }]
      );
      return;
    }

    setResolving(true);
    try {
      const result = await organizationApi.resolveQr(parsed.token);
      if (result.type === 'SERVICE' && result.service) {
        // Direct navigation to service desk - bypass any intermediate choice
        router.replace({
          pathname: `/service/${result.service.id}`,
          params: { qrToken: result.qrCode?.token || parsed.token },
        });
        return;
      }
      if (result.branch) {
        router.replace(`/branch/${result.branch.id}`);
        return;
      }
      setResolvedResult(result);
    } catch (err: any) {
      const msg = err.message || '';
      let title = 'QR Code Unavailable';
      if (msg.includes('no longer active') || msg.includes('expired')) {
        title = 'QR Code Expired';
      } else if (msg.includes('revoked') || msg.includes('closed by the organization')) {
        title = 'QR Code Revoked';
      }

      Alert.alert(
        title,
        msg || 'This QueueLess QR code is no longer active. Please scan a current QR code.',
        [
          { text: 'Scan Another Code', onPress: () => setScanned(false) },
          {
            text: 'Browse Services Manually',
            onPress: () => router.replace('/queue/join'),
          },
        ]
      );
    } finally {
      setResolving(false);
    }
  };

  const handleManualSubmit = () => {
    if (!manualCode.trim()) return;
    processQrString(manualCode.trim());
  };

  // Web or Simulator fallback UI
  if (Platform.OS === 'web' || !permission?.granted) {
    return (
      <View style={styles.outerContainer}>
        <MobileHeader title="Scan QueueLess QR" />
        <ScreenWrapper scrollable topSafeArea={false} bottomSafeArea>
          <View style={styles.fallbackCard}>
            <View style={styles.cameraIconCircle}>
              <QrCode color={COLORS.primaryLight} size={48} />
            </View>
            <Text style={styles.fallbackTitle}>Camera Access Required</Text>
            <Text style={styles.fallbackSubtitle}>
              QueueLess uses your camera to scan official QR standees at bank branches and service desks.
            </Text>

            {!permission?.granted ? (
              <TouchableOpacity style={styles.requestBtn} onPress={requestPermission}>
                <Camera color={COLORS.white} size={18} style={{ marginRight: 8 }} />
                <Text style={styles.requestBtnText}>Grant Camera Permission</Text>
              </TouchableOpacity>
            ) : null}

            {/* Manual Code Fallback */}
            <View style={styles.manualBox}>
              <Text style={styles.manualLabel}>Or Enter Branch/Service Code Manually</Text>
              <View style={styles.manualInputRow}>
                <TextInput
                  style={styles.manualInput}
                  placeholder="e.g. QR-ACCRA-01 or service ID"
                  placeholderTextColor={COLORS.textMuted}
                  value={manualCode}
                  onChangeText={setManualCode}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.manualSubmitBtn, !manualCode.trim() && { opacity: 0.5 }]}
                  onPress={handleManualSubmit}
                  disabled={!manualCode.trim() || resolving}
                >
                  {resolving ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <ArrowRight color={COLORS.white} size={18} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScreenWrapper>
      </View>
    );
  }

  return (
    <View style={styles.outerContainer}>
      {/* Live Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
      />

      {/* Camera Header Overlay */}
      <View style={[styles.cameraHeaderOverlay, { paddingTop: Math.max(insets.top, 16) }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.circleCloseBtn}
          activeOpacity={0.7}
        >
          <X color={COLORS.white} size={22} />
        </TouchableOpacity>
        <Text style={styles.cameraTitle}>Scan Branch or Desk Standee</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Target Scan Reticle */}
      <View style={styles.reticleContainer}>
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.reticleHint}>Align official QR code within frame</Text>
      </View>

      {/* Loading Overlay */}
      {resolving && (
        <View style={styles.resolvingOverlay}>
          <ActivityIndicator color={COLORS.white} size="large" />
          <Text style={styles.resolvingText}>Validating official QR security token...</Text>
        </View>
      )}

      {/* QR Resolved Modal Card (Part 16) */}
      {resolvedResult && (
        <View style={[styles.resolvedCard, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 20) }]}>
          <View style={[styles.cardIndicator, { backgroundColor: colors.surfaceBorder }]} />
          <View style={styles.resolvedHeader}>
            <Text style={[styles.resolvedOrgName, { color: colors.primary }]}>{resolvedResult.organization?.name}</Text>
            <Text style={[styles.resolvedBranchName, { color: colors.text }]}>{resolvedResult.branch?.name}</Text>
            {resolvedResult.service && (
              <Text style={[styles.resolvedServiceName, { color: colors.text }]}>{resolvedResult.service.name}</Text>
            )}
            <Text style={[styles.resolvedDuration, { color: colors.textSecondary }]}>
              Estimated service time: ~{resolvedResult.service?.duration || 15} minutes
            </Text>
          </View>

          <View style={styles.resolvedActions}>
            <TouchableOpacity
              style={[styles.resolvedPrimaryBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                if (resolvedResult.type === 'SERVICE' && resolvedResult.service) {
                  router.replace(`/service/${resolvedResult.service.id}`);
                } else {
                  router.replace(`/branch/${resolvedResult.branch.id}`);
                }
              }}
            >
              <Users color="#ffffff" size={18} style={{ marginRight: 6 }} />
              <Text style={styles.resolvedPrimaryBtnText}>Join Queue</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.resolvedSecondaryBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.surfaceBorder }]}
              onPress={() => {
                router.replace(`/appointment/book?branchId=${resolvedResult.branch.id}&serviceId=${resolvedResult.service?.id || ''}`);
              }}
            >
              <Calendar color={colors.primary} size={18} style={{ marginRight: 6 }} />
              <Text style={[styles.resolvedSecondaryBtnText, { color: colors.primary }]}>Book Appointment</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  cameraHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 10,
  },
  circleCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraTitle: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '800',
  },
  reticleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: 250,
    height: 250,
    borderRadius: RADIUS.xl,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: COLORS.primaryLight,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: RADIUS.lg,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: RADIUS.lg,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: RADIUS.lg,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: RADIUS.lg,
  },
  reticleHint: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    fontWeight: '600',
    marginTop: SPACING.lg,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
  },
  resolvingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  resolvingText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
    marginTop: SPACING.md,
  },
  resolvedCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.lg,
    zIndex: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cardIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: COLORS.surfaceBorder,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  resolvedHeader: {
    marginBottom: SPACING.md,
  },
  resolvedOrgName: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  resolvedBranchName: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  resolvedServiceName: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  resolvedDuration: {
    color: COLORS.textSecondary,
    fontSize: 12,
    marginTop: 4,
  },
  resolvedActions: {
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  resolvedPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  resolvedPrimaryBtnText: {
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '800',
  },
  resolvedSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(37, 99, 235, 0.3)',
    borderRadius: RADIUS.xl,
    paddingVertical: SPACING.md,
  },
  resolvedSecondaryBtnText: {
    color: COLORS.primaryLight,
    fontSize: 14,
    fontWeight: '700',
  },
  fallbackCard: {
    alignItems: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  cameraIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(37, 99, 235, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  fallbackTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  fallbackSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.xl,
  },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xl,
  },
  requestBtnText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '700',
  },
  manualBox: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.xl,
    padding: SPACING.md,
  },
  manualLabel: {
    color: COLORS.textSecondary,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  manualInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  manualInput: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderColor: COLORS.surfaceBorder,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    color: COLORS.text,
    fontSize: 14,
  },
  manualSubmitBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: RADIUS.lg,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
