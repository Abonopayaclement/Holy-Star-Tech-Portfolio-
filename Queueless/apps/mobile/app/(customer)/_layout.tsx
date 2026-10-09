import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/context/ThemeContext';
import { Home, Users, Calendar, Clock, Settings } from 'lucide-react-native';

export default function CustomerTabsLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const bottomInset = Math.max(insets.bottom, 6);
  const tabHeight = 54 + bottomInset;

  return (
    <Tabs
      screenOptions={{
        sceneStyle: {
          backgroundColor: colors.background,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.surfaceBorder,
          borderTopWidth: 1,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '800',
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          headerTitle: 'QueueLess',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Home color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="queue"
        options={{
          title: 'Queues',
          headerTitle: 'Live Queue Status',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          title: 'Appointments',
          headerTitle: 'My Appointments',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Calendar color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          headerTitle: 'Activity History',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Clock color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          headerTitle: 'Settings',
          tabBarIcon: ({ color, size }: { color: string; size: number }) => <Settings color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}
