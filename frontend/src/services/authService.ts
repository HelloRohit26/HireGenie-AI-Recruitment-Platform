/**
 * HireGenie AI - Dual-Portal Authentication & Session API Service
 * Handles live FastAPI backend user registration, authentication, bearer token management, and role-based access.
 */

import { apiRequest, ApiResponse, setAuthToken } from './apiClient';
import { UserProfile } from '../types';

export interface AuthRegisterRequest {
  fullName: string;
  email: string;
  password: string;
  role: 'recruiter' | 'candidate';
}

export interface AuthLoginRequest {
  email: string;
  password: string;
  role: 'recruiter' | 'candidate';
}

export interface AuthLoginResponse {
  token: string;
  user: UserProfile;
  role: 'recruiter' | 'candidate';
  email: string;
}

export const authService = {
  /**
   * Registers a new user (Recruiter or Candidate) with FastAPI backend
   */
  async register(data: AuthRegisterRequest): Promise<ApiResponse<AuthLoginResponse>> {
    const backendRole = data.role === 'recruiter' ? 'RECRUITER' : 'CANDIDATE';
    
    // Register user in backend
    const regRes = await apiRequest<any>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        full_name: data.fullName,
        email: data.email,
        password: data.password,
        role: backendRole,
      })
    });

    // Auto-login after successful registration
    return this.login({
      email: data.email,
      password: data.password,
      role: data.role
    });
  },

  /**
   * Authenticates recruiter or candidate user credentials against live FastAPI backend
   */
  async login(credentials: AuthLoginRequest): Promise<ApiResponse<AuthLoginResponse>> {
    const res = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      })
    });

    const token = res.data?.access_token;
    if (!token) {
      throw new Error("Authentication failed: No access token received from server.");
    }

    const userObj = res.data?.user || {};
    const fullName = userObj.full_name || credentials.email.split('@')[0];
    const userRole = (userObj.role ? String(userObj.role).toLowerCase() : credentials.role) as 'recruiter' | 'candidate';

    setAuthToken(token);

    // Persist UI session info
    localStorage.setItem('hg_auth_token', token);
    localStorage.setItem('hg_user_name', fullName);
    localStorage.setItem('hg_user_email', credentials.email);
    localStorage.setItem('hg_user_role', userRole);

    const userData: UserProfile = {
      name: fullName,
      role: userRole === 'recruiter' ? 'Lead Technical Recruiter' : 'Candidate',
      greeting: userRole === 'recruiter' ? `Welcome, ${fullName}.` : `Welcome back, ${fullName}.`,
      subtitle: userRole === 'recruiter' ? 'Your autonomous hiring engine is active.' : 'Your application dashboard is active.'
    };

    return {
      ...res,
      data: {
        token,
        user: userData,
        role: userRole,
        email: credentials.email
      }
    };
  },

  /**
   * Fetches currently authenticated user profile from FastAPI backend
   */
  async getCurrentUser(): Promise<ApiResponse<UserProfile>> {
    try {
      const res = await apiRequest<any>('/auth/me', { method: 'GET' });
      const fullName = res.data?.full_name || 'HireGenie User';
      const userRole = res.data?.role ? String(res.data.role).toLowerCase() : 'candidate';
      
      const user: UserProfile = {
        name: fullName,
        role: userRole === 'recruiter' ? 'Lead Technical Recruiter' : 'Candidate',
        greeting: `Welcome, ${fullName}`,
        subtitle: 'Connected to live HireGenie AI engine'
      };
      return { ...res, data: user };
    } catch (err) {
      this.logout();
      throw err;
    }
  },

  /**
   * Cleans fake test data from database via backend admin API
   */
  async cleanFakeData(): Promise<ApiResponse<any>> {
    return apiRequest<any>('/admin/clean-fake-data', { method: 'POST' });
  },

  /**
   * Logs out user and clears bearer token & local session
   */
  async logout(): Promise<void> {
    setAuthToken(null);
    localStorage.removeItem('hg_auth_token');
    localStorage.removeItem('hg_user_name');
    localStorage.removeItem('hg_user_email');
    localStorage.removeItem('hg_user_role');
  }
};
