import React, { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';
import { COLORS } from '../src/constants/theme';

export default function Index() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        router.replace('/(customer)/home');
      } else {
        router.replace('/(auth)/login');
      }
    }
  }, [user, isLoading]);

  return (
    <View style={styles.container}>
      <View style={styles.logoBadge}>
        <Text style={styles.logoText}>Q</Text>
      </View>
      <Text style={styles.brandTitle}>QueueLess</Text>
      <Text style={styles.brandSubtitle}>Customer Mobile Platform</Text>
      <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  logoBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoText: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: '900',
  },
  brandTitle: {
    color: COLORS.text,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  brandSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 4,
    fontWeight: '500',
  },
  loader: {
    marginTop: 32,
  },
});
