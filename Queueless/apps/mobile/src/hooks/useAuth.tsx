import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import authApi, { LoginPayload, RegisterPayload } from '../api/authApi';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'queueless_auth_token';
const USER_KEY = 'queueless_auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session from AsyncStorage on mount
  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          // Silently refresh profile in background
          try {
            const freshUser = await authApi.getMe();
            setUser(freshUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          } catch (e) {
            // If token invalid, storage was cleared by interceptor
          }
        }
      } catch (e) {
        console.warn('Failed to restore authentication session', e);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const login = async (payload: LoginPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.login(payload);
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setIsLoading(true);
    try {
      const data = await authApi.register(payload);
      setToken(data.token);
      setUser(data.user);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    setToken(null);
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  };

  const refreshUser = async () => {
    try {
      const freshUser = await authApi.getMe();
      setUser(freshUser);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(freshUser));
    } catch (e) {
      console.warn('Failed to refresh user', e);
    }
  };

  const updateProfile = async (data: Partial<User>): Promise<User> => {
    const updatedUser = await authApi.updateProfile(data);
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
    return updatedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        register,
        logout,
        refreshUser,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context as AuthContextType;
};

export default useAuth;
