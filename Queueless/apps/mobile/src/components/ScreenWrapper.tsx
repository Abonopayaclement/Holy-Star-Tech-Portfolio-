import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  type ViewStyle,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING } from '../constants/theme';
import { useTheme } from '../context/ThemeContext';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[];
  contentContainerStyle?: ViewStyle | ViewStyle[];
  scrollable?: boolean;
  refreshControl?: React.ReactElement;
  topSafeArea?: boolean;
  bottomSafeArea?: boolean;
  safeTop?: boolean;
  safeBottom?: boolean;
  backgroundColor?: string;
  keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
}

export const ScreenWrapper: React.FC<ScreenWrapperProps> = ({
  children,
  style,
  contentContainerStyle,
  scrollable = false,
  refreshControl,
  topSafeArea,
  bottomSafeArea,
  safeTop,
  safeBottom,
  backgroundColor,
  keyboardShouldPersistTaps = 'handled',
}) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const resolvedBg = backgroundColor || colors.background;
  const applyTopSafe = safeTop ?? topSafeArea ?? false;
  const applyBottomSafe = safeBottom ?? bottomSafeArea ?? true;

  const containerStyle: ViewStyle = {
    flex: 1,
    backgroundColor: resolvedBg,
    paddingTop: applyTopSafe ? insets.top : 0,
  };

  const bottomInset = applyBottomSafe ? Math.max(insets.bottom, SPACING.lg) : 0;

  if (scrollable) {
    return (
      <KeyboardAvoidingView
        style={containerStyle}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={[styles.scroll, style]}
          contentContainerStyle={[
            styles.contentContainer,
            { paddingBottom: bottomInset + SPACING.xl },
            contentContainerStyle,
          ]}
          keyboardShouldPersistTaps={keyboardShouldPersistTaps}
          refreshControl={refreshControl}
          showsVerticalScrollIndicator={false}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={containerStyle}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View
        style={[
          styles.nonScrollContainer,
          { paddingBottom: bottomInset },
          style,
        ]}
      >
        {children}
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
    paddingHorizontal: SPACING.md,
  },
  nonScrollContainer: {
    flex: 1,
  },
});

export default ScreenWrapper;
