import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { TopBar } from './TopBar';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib';

const mockLogout = vi.fn();
const mockChangePassword = vi.fn();

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: (...args: unknown[]) => mockLogout(...args),
    changePassword: (...args: unknown[]) => mockChangePassword(...args),
  },
}));

function renderTopBar() {
  return render(
    <MemoryRouter initialEntries={[ROUTES.discover]}>
      <Routes>
        <Route path="*" element={<TopBar />} />
        <Route path={ROUTES.login} element={<div data-testid="login-page" />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('TopBar', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('user-menu logout calls authService.logout, clears auth state, and navigates to /connexion', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({
      id: '1',
      email: 'thomas@foodcall.test',
      displayName: 'Thomas',
      avatarUrl: null,
      reputationScore: 0,
      createdAt: '',
      updatedAt: '',
    });

    renderTopBar();

    const summary = screen.getByText('Thomas');
    await user.click(summary);

    const logoutButton = screen.getByRole('button', { name: /se déconnecter/i });
    expect(logoutButton).toBeInTheDocument();

    mockLogout.mockImplementation(async () => {
      useAuthStore.getState().logout();
    });

    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().accessToken).toBeNull();
    });
  });

  it('shows user initials in avatar when user is set', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({
      id: '1',
      email: 'alice@foodcall.test',
      displayName: 'Alice',
      avatarUrl: null,
      reputationScore: 0,
      createdAt: '',
      updatedAt: '',
    });

    renderTopBar();

    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('shows default initial when no user', () => {
    renderTopBar();
    expect(screen.getByText('T')).toBeInTheDocument();
  });

  it('renders exactly 4 nav items: Découvrir, Groupes, Avis, Mes calls', () => {
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({
      id: '1',
      email: 'alice@foodcall.test',
      displayName: 'Alice',
      avatarUrl: null,
      reputationScore: 0,
      createdAt: '',
      updatedAt: '',
    });

    renderTopBar();

    expect(screen.getByText('Découvrir')).toBeInTheDocument();
    expect(screen.getByText('Groupes')).toBeInTheDocument();
    expect(screen.getByText('Avis')).toBeInTheDocument();
    expect(screen.getByText('Mes calls')).toBeInTheDocument();

    const nav = screen.getByRole('navigation', { name: /navigation principale/i });
    const links = nav.querySelectorAll('a');
    expect(links).toHaveLength(4);
  });

  it('opens user menu dropdown when summary is clicked', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({
      id: '1',
      email: 'thomas@foodcall.test',
      displayName: 'Thomas',
      avatarUrl: null,
      reputationScore: 0,
      createdAt: '',
      updatedAt: '',
    });

    renderTopBar();

    const summary = screen.getByText('Thomas');
    await user.click(summary);

    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /se déconnecter/i })).toBeInTheDocument();
  });

  it('user menu contains Profil and Paramètres links', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setTokens('access-token', 'refresh-token');
    useAuthStore.getState().setUser({
      id: '1',
      email: 'thomas@foodcall.test',
      displayName: 'Thomas',
      avatarUrl: null,
      reputationScore: 0,
      createdAt: '',
      updatedAt: '',
    });

    renderTopBar();

    const summary = screen.getByText('Thomas');
    await user.click(summary);

    const profileLink = screen.getByText('Profil');
    const settingsLink = screen.getByText('Paramètres');
    expect(profileLink).toBeInTheDocument();
    expect(profileLink.closest('a')).toHaveAttribute('href', '/profil');
    expect(settingsLink).toBeInTheDocument();
    expect(settingsLink.closest('a')).toHaveAttribute('href', '/parametres');
  });
});