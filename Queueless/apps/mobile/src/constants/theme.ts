export const LIGHT_COLORS = {
  primary: '#2563eb', // Rich Blue
  primaryDark: '#1d4ed8',
  primaryLight: '#3b82f6',
  secondary: '#4f46e5', // Indigo
  accent: '#0284c7', // Sky Cyan

  // Light Canvas
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceLight: '#f1f5f9',
  surfaceBorder: '#e2e8f0',

  // Card & Text
  card: '#ffffff',
  text: '#0f172a',
  textSecondary: '#475569',
  textMuted: '#94a3b8',

  // Queue State Machine Badges
  statusWaiting: '#2563eb',
  statusWaitingBg: 'rgba(37, 99, 235, 0.1)',
  statusCalling: '#d97706',
  statusCallingBg: 'rgba(217, 119, 6, 0.12)',
  statusServing: '#059669',
  statusServingBg: 'rgba(5, 150, 105, 0.12)',
  statusCompleted: '#64748b',
  statusCompletedBg: 'rgba(100, 116, 139, 0.1)',
  statusCancelled: '#dc2626',
  statusCancelledBg: 'rgba(220, 38, 38, 0.1)',

  // Alerts
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  error: '#ef4444',
  info: '#0284c7',

  // Semantic design tokens for consistent theming
  surfaceSecondary: '#f1f5f9',
  border: '#e2e8f0',
  textPrimary: '#0f172a',
  inputBackground: '#f1f5f9',
  inputBorder: '#cbd5e1',
  icon: '#64748b',
  disabled: '#94a3b8',
  disabledBg: '#f1f5f9',

  white: '#ffffff',
  black: '#000000',
};

export const DARK_COLORS = {
  primary: '#3b82f6', // Bright Blue
  primaryDark: '#1d4ed8',
  primaryLight: '#60a5fa',
  secondary: '#6366f1', // Indigo
  accent: '#06b6d4', // Cyan

  // Dark Canvas
  background: '#0b1329', // Deep navy
  surface: '#151f38',
  surfaceLight: '#1e294b',
  surfaceBorder: '#29375e',

  // Card & Text
  card: '#16203a',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',

  // Queue State Machine Badges
  statusWaiting: '#3b82f6',
  statusWaitingBg: 'rgba(59, 130, 246, 0.18)',
  statusCalling: '#f59e0b',
  statusCallingBg: 'rgba(245, 158, 11, 0.18)',
  statusServing: '#10b981',
  statusServingBg: 'rgba(16, 185, 129, 0.18)',
  statusCompleted: '#64748b',
  statusCompletedBg: 'rgba(100, 116, 139, 0.18)',
  statusCancelled: '#ef4444',
  statusCancelledBg: 'rgba(239, 68, 68, 0.18)',

  // Alerts
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  error: '#ef4444',
  info: '#38bdf8',

  // Semantic design tokens for consistent theming
  surfaceSecondary: '#1e294b',
  border: '#29375e',
  textPrimary: '#f8fafc',
  inputBackground: '#151f38',
  inputBorder: '#29375e',
  icon: '#94a3b8',
  disabled: '#64748b',
  disabledBg: '#1e294b',

  white: '#ffffff',
  black: '#000000',
};

// Default export defaults to LIGHT_COLORS per user requirement
export const COLORS = LIGHT_COLORS;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};
