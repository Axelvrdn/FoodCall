import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { API_ERROR_CODES, API_ROUTES, env } from '@/lib';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';
import type { AuthResponse } from '@/types/api';

export interface NormalizedApiError { status: number; message: string; code: string; }
interface RetryConfig extends AxiosRequestConfig { _retry?: boolean; }

export const apiClient = axios.create({ baseURL: env.apiUrl, headers: { 'Content-Type': 'application/json' } });
let refreshPromise: Promise<string | null> | null = null;

function normalizeApiError(error: AxiosError): NormalizedApiError {
  const status = error.response?.status ?? 500;
  const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;
  const message = Array.isArray(data?.message) ? data.message.join(', ') || undefined : data?.message;
  return {
    status,
    message: message ?? API_ERROR_CODES[status] ?? 'Erreur inconnue.',
    code: data?.error ?? String(status),
  };
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) return null;
    refreshPromise = axios.post<AuthResponse>(`${env.apiUrl}${API_ROUTES.refresh}`, { refreshToken })
      .then((response) => {
        useAuthStore.getState().setTokens(response.data.accessToken, response.data.refreshToken);
        return response.data.accessToken;
      })
      .catch(() => {
        useAuthStore.getState().logout();
        queryClient.clear();
        return null;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use((response) => response, async (error: AxiosError) => {
  const original = error.config as RetryConfig | undefined;
  if (error.response?.status === 401 && original && !original._retry && !original.url?.includes(API_ROUTES.refresh)) {
    original._retry = true;
    const token = await refreshAccessToken();
    if (token) {
      original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
      return apiClient(original);
    }
  }
  return Promise.reject(normalizeApiError(error));
});

export { normalizeApiError };
