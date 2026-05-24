import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthBootstrapProvider } from './AuthBootstrapProvider';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('@/services/users-service', () => ({
  usersService: { me: vi.fn() },
}));

import { usersService } from '@/services/users-service';

const mockUser = { id: 'user-1', email: 'thomas@foodcall.test', displayName: 'Thomas', avatarUrl: null, reputationScore: 42, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' };

describe('AuthBootstrapProvider', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('with access token and no user, hydrates user from /users/me', async () => {
    vi.mocked(usersService.me).mockResolvedValue(mockUser);
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrapProvider>
          <div data-testid="children">App loaded</div>
        </AuthBootstrapProvider>
      </QueryClientProvider>
    );

    expect(screen.getByText('Chargement de la session…')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().user).toEqual(mockUser);
  });

  it('with no access token, does not call /users/me and renders children immediately', () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrapProvider>
          <div data-testid="children">App loaded</div>
        </AuthBootstrapProvider>
      </QueryClientProvider>
    );

    expect(screen.getByTestId('children')).toBeInTheDocument();
    expect(usersService.me).not.toHaveBeenCalled();
  });

  it('when /users/me fails, logs out and renders children for route guard redirect', async () => {
    vi.mocked(usersService.me).mockRejectedValue(new Error('Unauthorized'));
    useAuthStore.getState().setTokens('expired-token', 'refresh-token');

    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <AuthBootstrapProvider>
          <div data-testid="children">App loaded</div>
        </AuthBootstrapProvider>
      </QueryClientProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('children')).toBeInTheDocument();
    });

    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
  });
});