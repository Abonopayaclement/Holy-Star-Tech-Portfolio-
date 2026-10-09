import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Dynamically resolves the API Base URL.
 * Prioritizes the active Expo Metro bundler host IP in local dev mode,
 * which automatically adapts when testing on physical devices or emulators,
 * then falls back to configured EXPO_PUBLIC_API_URL, Android 10.0.2.2, or localhost.
 */
export const resolveApiBaseUrl = (): string => {
  const debuggerHost =
    (Constants.expoConfig as any)?.hostUri ||
    (Constants as any).manifest2?.extra?.expoClient?.hostUri ||
    (Constants as any).manifest?.debuggerHost;

  if (debuggerHost) {
    const hostIp = debuggerHost.split(':')[0];
    if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
      return `http://${hostIp}:5000/api`;
    }
  }

  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor to attach JWT & diagnostics logging
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await AsyncStorage.getItem('queueless_auth_token');
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Failed to read auth token from storage', e);
    }

    if (__DEV__) {
      console.log(`[QueueLess API Request] ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor with structured error logging (Part 28)
apiClient.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      console.log(`[QueueLess API Success] ${response.config.method?.toUpperCase()} ${response.config.url} [${response.status}]`);
    }
    return response;
  },
  async (error: AxiosError<{ error?: string; message?: string; code?: string }>) => {
    const status = error.response?.status;
    const endpoint = error.config ? `${error.config.baseURL}${error.config.url}` : 'Unknown';
    const method = error.config?.method?.toUpperCase() || 'GET';
    const errData = error.response?.data;

    const errorMessage =
      errData?.error ||
      errData?.message ||
      error.message ||
      'An unexpected network error occurred';

    if (__DEV__) {
      console.warn(
        `[QueueLess API Error] ${method} ${endpoint} | Status: ${status || 'Network Error'} | Code: ${errData?.code || 'ERR_NETWORK'} | Detail: ${errorMessage}`
      );
    }

    if (status === 401) {
      // Token expired or invalid
      try {
        await AsyncStorage.removeItem('queueless_auth_token');
        await AsyncStorage.removeItem('queueless_auth_user');
      } catch (e) {
        // ignore
      }
    }

    return Promise.reject(new Error(errorMessage));
  }
);

export default apiClient;
