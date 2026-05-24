import { API_ROUTES } from '@/lib';
import { apiClient } from './api-client';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';
import type { AuthResponse, ChangePasswordRequest, LoginRequest, RegisterRequest, User } from '@/types/api';

export const authService = {
  login: (payload: LoginRequest) => apiClient.post<AuthResponse>(API_ROUTES.login, payload).then((r) => r.data),
  register: (payload: RegisterRequest) => apiClient.post<AuthResponse>(API_ROUTES.register, payload).then((r) => r.data),
  me: () => apiClient.get<User>(API_ROUTES.me).then((r) => r.data),
  logout: async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    try {
      if (refreshToken) {
        await apiClient.post<void>(API_ROUTES.logout, { refreshToken });
      }
    } catch {
      // Network errors are acceptable; local state always clears
    } finally {
      useAuthStore.getState().logout();
      queryClient.clear();
    }
  },
  changePassword: (payload: ChangePasswordRequest) => apiClient.post<void>(API_ROUTES.changePassword, payload),
};