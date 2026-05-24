import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SettingsPage } from './SettingsPage';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib';

const mockChangePassword = vi.fn();
const mockLogout = vi.fn();

vi.mock('@/services', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    me: vi.fn(),
    logout: (...args: unknown[]) => mockLogout(...args),
    changePassword: (...args: unknown[]) => mockChangePassword(...args),
  },
}));

vi.mock('@/app/query-client', () => ({
  queryClient: { clear: vi.fn() },
}));

function renderSettings() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.settings]}>
        <Routes>
          <Route path={ROUTES.settings} element={<SettingsPage />} />
          <Route path={ROUTES.login} element={<div data-testid="login-page" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('SettingsPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('renders the four scoped sections: Compte, Confidentialité, Sécurité, Affichage', () => {
    renderSettings();

    expect(screen.getAllByText('Informations du compte').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Confidentialité').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Sécurité').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText("Préférences d'affichage").length).toBeGreaterThanOrEqual(1);
  });

  it('does not render notification, food preference, favorite, or group departure address controls', () => {
    renderSettings();

    expect(screen.queryByText(/préférences alimentaires/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/notifications/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/favoris/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/adresse de départ/i)).not.toBeInTheDocument();
  });

  describe('Change Password form', () => {
    it('requires current password and a new password passing validatePassword before calling authService.changePassword', async () => {
      const user = userEvent.setup();
      renderSettings();

      const currentInput = screen.getByLabelText('Mot de passe actuel');
      const newInput = screen.getByLabelText('Nouveau mot de passe');
      const submitButton = screen.getByRole('button', { name: /changer le mot de passe/i });

      await user.type(currentInput, 'OldPass123!');
      await user.type(newInput, 'short');
      await user.click(submitButton);

      expect(screen.getByRole('alert')).toHaveTextContent('12 caractères minimum');
      expect(mockChangePassword).not.toHaveBeenCalled();
    });

    it('calls authService.changePassword with currentPassword and newPassword on valid input', async () => {
      const user = userEvent.setup();
      mockChangePassword.mockResolvedValueOnce(undefined);

      renderSettings();

      await user.type(screen.getByLabelText('Mot de passe actuel'), 'OldPass123!');
      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass123!@');
      await user.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

      expect(mockChangePassword).toHaveBeenCalledWith({
        currentPassword: 'OldPass123!',
        newPassword: 'NewPass123!@',
      });
    });

    it('successful password change clears local auth state and navigates to /connexion', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setTokens('access-token', 'refresh-token');
      mockChangePassword.mockImplementationOnce(async () => {
        useAuthStore.getState().logout();
      });

      renderSettings();

      await user.type(screen.getByLabelText('Mot de passe actuel'), 'OldPass123!');
      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass123!@');
      await user.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

      await waitFor(() => {
        expect(useAuthStore.getState().isAuthenticated).toBe(false);
        expect(useAuthStore.getState().accessToken).toBeNull();
      });
    });

    it('401 from change-password renders "Mot de passe actuel incorrect." and does not clear the current session', async () => {
      const user = userEvent.setup();
      useAuthStore.getState().setTokens('access-token', 'refresh-token');
      mockChangePassword.mockRejectedValueOnce({ status: 401, message: 'Unauthorized', code: 'Unauthorized' });

      renderSettings();

      await user.type(screen.getByLabelText('Mot de passe actuel'), 'WrongPass123!');
      await user.type(screen.getByLabelText('Nouveau mot de passe'), 'NewPass123!@');
      await user.click(screen.getByRole('button', { name: /changer le mot de passe/i }));

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Mot de passe actuel incorrect.');
      });

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().accessToken).toBe('access-token');
    });

    it('displays session revocation notice', () => {
      renderSettings();

      expect(screen.getByText(/toutes vos sessions seront déconnectées/i)).toBeInTheDocument();
    });
  });
});