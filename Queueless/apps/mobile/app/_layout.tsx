import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../src/hooks/useAuth';
import { ThemeProvider, useTheme } from '../src/context/ThemeContext';

function ThemedNavigation() {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.background} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(customer)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="organization/[organizationId]" />
        <Stack.Screen name="branch/[branchId]" />
        <Stack.Screen name="service/[serviceId]" />
        <Stack.Screen name="queue/join" />
        <Stack.Screen name="queue/[ticketId]" />
        <Stack.Screen name="appointment/book" />
        <Stack.Screen name="appointment/[appointmentId]" />
        <Stack.Screen name="profile/edit" />
        <Stack.Screen name="scan" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <ThemedNavigation />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
