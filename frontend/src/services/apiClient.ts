/**
 * HireGenie AI - Centralized FastAPI HTTP API Client
 * Supports authentication headers, request interceptors, typed models,
 * and automatic mock data fallback when the FastAPI backend is offline.
 */

const getApiBaseUrl = (): string => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) {
    return (import.meta as any).env.VITE_API_BASE_URL;
  }
  return 'http://localhost:8000/api/v1';
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
  isMockFallback?: boolean;
}

export interface ApiError {
  message: string;
  statusCode: number;
  details?: any;
}

/**
 * Gets stored auth bearer token from localStorage
 */
export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('hg_auth_token');
  }
  return null;
};

/**
 * Sets auth bearer token in localStorage
 */
export const setAuthToken = (token: string | null): void => {
  if (typeof window !== 'undefined') {
    if (token) {
      localStorage.setItem('hg_auth_token', token);
    } else {
      localStorage.removeItem('hg_auth_token');
    }
  }
};

const isMockEnabled = (): boolean => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    return (import.meta as any).env.VITE_ENABLE_MOCK_DATA === 'true';
  }
  return false;
};

/**
 * Centralized API request helper with mock fallback safety
 */
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  mockFallbackData?: T
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  const fullUrl = `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  try {
    const response = await fetch(fullUrl, config);

    if (!response.ok) {
      // Allow fallback ONLY if explicitly enabled in environment configuration
      if (isMockEnabled() && mockFallbackData !== undefined) {
        console.warn(`[HireGenie API] Endpoint ${endpoint} returned ${response.status}. Using mock fallback.`);
        return {
          data: mockFallbackData,
          status: response.status,
          isMockFallback: true
        };
      }

      const errorData = await response.json().catch(() => ({}));
      throw {
        message: errorData.detail || errorData.message || `API error: ${response.statusText}`,
        statusCode: response.status,
        details: errorData
      } as ApiError;
    }

    const data = await response.json();
    return {
      data,
      status: response.status,
      isMockFallback: false
    };
  } catch (error: any) {
    // Connection error / offline fallback ONLY if explicitly enabled
    if (isMockEnabled() && mockFallbackData !== undefined) {
      console.info(`[HireGenie API] Backend offline (${fullUrl}). Serving mock data fallback for ${endpoint}.`);
      return {
        data: mockFallbackData,
        status: 200,
        isMockFallback: true
      };
    }

    throw {
      message: error.message || 'Unable to connect to HireGenie server.',
      statusCode: error.statusCode || 500,
      details: error
    } as ApiError;
  }
}
