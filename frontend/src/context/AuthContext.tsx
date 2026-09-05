import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService, AuthLoginRequest, AuthRegisterRequest, AuthLoginResponse } from '../services/authService';
import { UserProfile } from '../types';

interface AuthContextType {
  user: UserProfile | null;
  role: 'recruiter' | 'candidate' | null;
  email: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: AuthLoginRequest) => Promise<AuthLoginResponse>;
  register: (data: AuthRegisterRequest) => Promise<AuthLoginResponse>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const name = localStorage.getItem('hg_user_name');
      const role = (localStorage.getItem('hg_user_role') || '').toLowerCase();
      if (name && (role === 'recruiter' || role === 'candidate')) {
        return {
          name,
          role: role === 'recruiter' ? 'Lead Technical Recruiter' : 'Candidate',
          greeting: `Welcome back, ${name}`,
          subtitle: 'Active session',
        };
      }
    }
    return null;
  });

  const [role, setRole] = useState<'recruiter' | 'candidate' | null>(() => {
    if (typeof window !== 'undefined') {
      const saved = (localStorage.getItem('hg_user_role') || '').toLowerCase();
      if (saved === 'recruiter' || saved === 'admin') return 'recruiter';
      if (saved === 'candidate') return 'candidate';
    }
    return null;
  });

  const [email, setEmail] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('hg_user_email') || null;
    }
    return null;
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session against live PostgreSQL backend on initial boot
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('hg_auth_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const res = await authService.getCurrentUser();
        if (res.data) {
          setUser(res.data);
          const savedRole = (localStorage.getItem('hg_user_role') || '').toLowerCase();
          setRole(savedRole === 'recruiter' || savedRole === 'admin' ? 'recruiter' : 'candidate');
          setEmail(localStorage.getItem('hg_user_email') || null);
        }
      } catch (err) {
        console.warn('[AuthContext] Session invalid or expired. Resetting credentials.');
        setUser(null);
        setRole(null);
        setEmail(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (credentials: AuthLoginRequest): Promise<AuthLoginResponse> => {
    const res = await authService.login(credentials);
    setUser(res.data.user);
    setRole(res.data.role);
    setEmail(res.data.email);
    return res.data;
  };

  const register = async (data: AuthRegisterRequest): Promise<AuthLoginResponse> => {
    const res = await authService.register(data);
    setUser(res.data.user);
    setRole(res.data.role);
    setEmail(res.data.email);
    return res.data;
  };

  const logout = async (): Promise<void> => {
    await authService.logout();
    setUser(null);
    setRole(null);
    setEmail(null);
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const res = await authService.getCurrentUser();
      if (res.data) {
        setUser(res.data);
      }
    } catch (err) {
      console.error('[AuthContext] Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        email,
        isAuthenticated: Boolean(user && role),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
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
  return context;
};
