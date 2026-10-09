import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';

export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  phoneNumber?: string | null;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  error?: string;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUser(response.data);
      } catch (err) {
        console.warn('Session expired or invalid token:', err);
        localStorage.removeItem('token');
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setError(undefined);
    const response = await axios.post(`${API_BASE_URL}/auth/login`, {
      email,
      password,
    });
    const { token, user: userData } = response.data;
    localStorage.setItem('token', token);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, error }}>
      {loading ? (
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          backgroundColor: '#f9fafb',
          flexDirection: 'column',
          fontFamily: 'sans-serif'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #3b82f6', 
            borderTopColor: 'transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite' 
          }}></div>
          <p style={{ marginTop: '16px', color: '#4b5563', fontWeight: 'bold' }}>
            Loading QueueLess...
          </p>
          <style>{`
            @keyframes spin {
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
