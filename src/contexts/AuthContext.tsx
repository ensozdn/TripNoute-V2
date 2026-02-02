'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@/types';
import { authService } from '@/services/firebase/FirebaseAuthService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; photoURL?: string }) => Promise<void>;
  deleteAccount: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((userData) => {
      setUser(userData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getErrorMessage = (err: unknown, defaultMessage: string): string => {
    if (err instanceof Error) {
      return err.message;
    }
    if (typeof err === 'object' && err !== null && 'message' in err) {
      return String(err.message);
    }
    return defaultMessage;
  };

  const login = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.login({ email, password });
      setUser(userData);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, displayName: string) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.register({ email, password, displayName });
      setUser(userData);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    try {
      setError(null);
      setLoading(true);
      const userData = await authService.loginWithGoogle();
      setUser(userData);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Google login failed'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await authService.logout();
      setUser(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Logout failed'));
      throw err;
    }
  };

  const updateProfile = async (data: { displayName?: string; photoURL?: string }) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');

      await authService.updateProfile(data);
      setUser({ ...user, ...data });
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Profile update failed'));
      throw err;
    }
  };

  const deleteAccount = async () => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');

      await authService.deleteAccount();
      setUser(null);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Account deletion failed'));
      throw err;
    }
  };

  const clearError = () => setError(null);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    register,
    loginWithGoogle,
    logout,
    updateProfile,
    deleteAccount,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
