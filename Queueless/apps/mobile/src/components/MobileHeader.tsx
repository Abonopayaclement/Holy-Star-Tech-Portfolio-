import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightElement?: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  transparent?: boolean;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  title,
  subtitle,
  showBack = true,
  onBack,
  rightElement,
  style,
  transparent = false,
}) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 16),
          backgroundColor: transparent ? 'transparent' : colors.surface,
          borderBottomColor: transparent ? 'transparent' : colors.surfaceBorder,
        },
        style,
      ]}
    >
      <View style={styles.contentRow}>
        <View style={styles.leftSlot}>
          {showBack && (
            <TouchableOpacity
              onPress={handleBack}
              style={[styles.backButton, { backgroundColor: colors.surfaceLight }]}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ArrowLeft color={colors.text} size={22} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSlot}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>
            {title}
          </Text>
        </View>

        <View style={styles.rightSlot}>
          {rightElement || null}
        </View>
      </View>

      {subtitle ? (
        <View style={styles.subtitleContainer}>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    minHeight: 44,
  },
  leftSlot: {
    width: 44,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  rightSlot: {
    width: 44,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  subtitleContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: 4,
    paddingBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default MobileHeader;
