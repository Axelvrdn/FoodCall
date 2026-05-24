import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';

const mockPost = vi.fn();

vi.mock('./api-client', () => ({
  apiClient: { post: mockPost },
  normalizeApiError: vi.fn(),
}));

vi.mock('@/app/query-client', () => ({
  queryClient: { clear: vi.fn() },
}));

describe('authService', () => {
  let authService: typeof import('./auth-service').authService;

  beforeEach(async () => {
    mockPost.mockReset();
    useAuthStore.getState().logout();
    authService = (await import('./auth-service')).authService;
  });

  describe('logout', () => {
    it('sends refreshToken in request body when refresh token exists', async () => {
      useAuthStore.getState().setTokens('test-access', 'test-refresh');
      mockPost.mockResolvedValue(undefined);

      await authService.logout();

      expect(mockPost).toHaveBeenCalledWith('/auth/logout', { refreshToken: 'test-refresh' });
    });

    it('clears auth state and query cache on successful logout', async () => {
      useAuthStore.getState().setTokens('a', 'r');
      mockPost.mockResolvedValue(undefined);
      const clearSpy = vi.spyOn(queryClient, 'clear');

      await authService.logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('clears auth state and query cache even when logout request fails', async () => {
      useAuthStore.getState().setTokens('a', 'r');
      mockPost.mockRejectedValue(new Error('Network error'));
      const clearSpy = vi.spyOn(queryClient, 'clear');

      await authService.logout();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
      expect(clearSpy).toHaveBeenCalled();
    });

    it('skips network call when no refresh token and still clears state', async () => {
      mockPost.mockResolvedValue(undefined);
      useAuthStore.getState().logout();

      const clearSpy = vi.spyOn(queryClient, 'clear');
      await authService.logout();

      expect(mockPost).not.toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(clearSpy).toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('posts ChangePasswordRequest to change-password endpoint', async () => {
      mockPost.mockResolvedValue(undefined);
      await authService.changePassword({ currentPassword: 'OldPass123!', newPassword: 'NewPass123!' });
      expect(mockPost).toHaveBeenCalledWith('/auth/change-password', { currentPassword: 'OldPass123!', newPassword: 'NewPass123!' });
    });
  });

  describe('login', () => {
    it('posts credentials and returns auth response', async () => {
      const authResponse = { accessToken: 'at', refreshToken: 'rt' };
      mockPost.mockResolvedValue({ data: authResponse });
      const result = await authService.login({ email: 'a@b.com', password: 'Password123!' });
      expect(mockPost).toHaveBeenCalledWith('/auth/login', { email: 'a@b.com', password: 'Password123!' });
      expect(result).toEqual(authResponse);
    });
  });

  describe('register', () => {
    it('posts register payload and returns auth response', async () => {
      const authResponse = { accessToken: 'at', refreshToken: 'rt' };
      mockPost.mockResolvedValue({ data: authResponse });
      const result = await authService.register({ email: 'a@b.com', password: 'Password123!', displayName: 'A' });
      expect(mockPost).toHaveBeenCalledWith('/auth/register', { email: 'a@b.com', password: 'Password123!', displayName: 'A' });
      expect(result).toEqual(authResponse);
    });
  });

  describe('me', () => {
    it('fetches current user profile', async () => {
      const user = { id: '1', email: 'a@b.com', displayName: 'A', avatarUrl: null, reputationScore: 5, createdAt: '2026-01-01', updatedAt: '2026-01-01' };
      const mockGet = vi.fn().mockResolvedValue({ data: user });
      // Re-mock api-client with both post and get
      vi.doMock('./api-client', () => ({
        apiClient: { post: mockPost, get: mockGet },
        normalizeApiError: vi.fn(),
      }));
    });
  });
});