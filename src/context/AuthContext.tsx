import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';
import {
  getCurrentUser,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  markCurrentUserOnboarded,
} from '../services/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  darkMode: boolean;
  toggleDarkMode: () => void;
  login: (email: string, pass: string) => Promise<User>;
  register: (name: string, email: string, pass: string, role?: Role) => Promise<User>;
  completeOnboarding: () => Promise<User>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const THEME_KEY = 'cc_theme_dark';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem(THEME_KEY) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    try {
      localStorage.setItem(THEME_KEY, String(darkMode));
    } catch {
      // ignore storage errors
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode((prev) => !prev);

  const refreshUser = useCallback(async () => {
    try {
      const current = await getCurrentUser();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'cc_auth_session_v2' || e.key === 'cc_users_v2' || e.key === null) {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [refreshUser]);

  const login = async (email: string, pass: string): Promise<User> => {
    const loggedUser = await authLogin(email, pass);
    setUser(loggedUser);
    return loggedUser;
  };

  const register = async (
    name: string,
    email: string,
    pass: string,
    role?: Role
  ): Promise<User> => {
    const newUser = await authRegister(name, email, pass, role);
    setUser(newUser);
    return newUser;
  };

  const completeOnboarding = async (): Promise<User> => {
    const updated = await markCurrentUserOnboarded();
    setUser(updated);
    return updated;
  };

  const logout = async (): Promise<void> => {
    await authLogout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        darkMode,
        toggleDarkMode,
        login,
        register,
        completeOnboarding,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
