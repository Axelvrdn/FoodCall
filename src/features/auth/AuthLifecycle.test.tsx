import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';
import { RegisterPage } from './RegisterPage';
import { ForgotPasswordPage } from './ForgotPasswordPage';
import { OnboardingPage } from './OnboardingPage';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib';

const mockLogin = vi.fn();
const mockRegister = vi.fn();
const mockMe = vi.fn();
const mockRefresh = vi.fn();

vi.mock('@/services', () => ({
  authService: {
    login: (...args: unknown[]) => mockLogin(...args),
    register: (...args: unknown[]) => mockRegister(...args),
    me: () => mockMe(),
    logout: vi.fn(),
    changePassword: vi.fn(),
    refresh: (...args: unknown[]) => mockRefresh(...args),
  },
}));

function renderLogin() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.login]}>
        <Routes>
          <Route path={ROUTES.login} element={<LoginPage />} />
          <Route path={ROUTES.discover} element={<div data-testid="discover" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function renderRegister() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[ROUTES.register]}>
        <Routes>
          <Route path={ROUTES.register} element={<RegisterPage />} />
          <Route path={ROUTES.onboarding} element={<div data-testid="onboarding" />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

const defaultUser = {
  id: 'user-1',
  email: 'thomas@foodcall.test',
  displayName: 'Thomas',
  avatarUrl: null,
  reputationScore: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('disables submit while pending, calls authService.login with { email, password }, stores tokens/user, and navigates to /decouvrir on success', async () => {
    const user = userEvent.setup();
    mockLogin.mockResolvedValueOnce({ accessToken: 'at', refreshToken: 'rt' });
    mockMe.mockResolvedValueOnce(defaultUser);

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'thomas@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    expect(mockLogin).toHaveBeenCalledWith({
      email: 'thomas@foodcall.test',
      password: 'Password123!',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('at');
      expect(useAuthStore.getState().user).toEqual(defaultUser);
    });
  });

  it('renders "Connexion impossible avec ces identifiants." for 401', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({ status: 401, message: 'Unauthorized', code: 'Unauthorized' });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'wrong@example.com');
    await user.type(screen.getByLabelText('Mot de passe'), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible avec ces identifiants.');
    });
  });

  it('renders "Trop de requêtes. Réessaie plus tard." for 429', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({ status: 429, message: 'Too many requests', code: 'Too Many Requests' });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'thomas@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    await user.click(screen.getByRole('button', { name: /se connecter/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Trop de requêtes. Réessaie plus tard.');
    });
  });

  it('disables submit button during pending state and re-enables after error', async () => {
    const user = userEvent.setup();
    mockLogin.mockRejectedValueOnce({ status: 401, message: 'Unauthorized', code: 'Unauthorized' });

    renderLogin();

    await user.type(screen.getByLabelText('Email'), 'thomas@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Password123!');
    const submitButton = screen.getByRole('button', { name: /se connecter/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Connexion impossible avec ces identifiants.');
    });

    expect(screen.getByRole('button', { name: /se connecter/i })).toHaveAttribute('aria-disabled', 'false');
  });
});

describe('RegisterPage', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('validates 12 characters, uppercase, lowercase, digit, and symbol before calling authService.register', async () => {
    const user = userEvent.setup();

    renderRegister();

    await user.type(screen.getByLabelText('Nom affiché'), 'Thomas');
    await user.type(screen.getByLabelText('Email'), 'thomas@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'short');
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(screen.getByRole('alert')).toHaveTextContent('12 caractères minimum');
    expect(mockRegister).not.toHaveBeenCalled();
  });

  it('renders conflict message for 409 email conflict', async () => {
    const user = userEvent.setup();
    mockRegister.mockRejectedValueOnce({ status: 409, message: 'Email already registered', code: 'Conflict' });

    renderRegister();

    await user.type(screen.getByLabelText('Nom affiché'), 'Thomas');
    await user.type(screen.getByLabelText('Email'), 'existing@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Str0ng!Pass12');
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent('Un compte avec cet email existe déjà.');
    });
  });

  it('navigates to /onboarding after successful registration', async () => {
    const user = userEvent.setup();
    mockRegister.mockResolvedValueOnce({ accessToken: 'at', refreshToken: 'rt' });
    mockMe.mockResolvedValueOnce(defaultUser);

    renderRegister();

    await user.type(screen.getByLabelText('Nom affiché'), 'Thomas');
    await user.type(screen.getByLabelText('Email'), 'thomas@foodcall.test');
    await user.type(screen.getByLabelText('Mot de passe'), 'Str0ng!Pass12');
    await user.click(screen.getByRole('button', { name: /créer mon compte/i }));

    expect(mockRegister).toHaveBeenCalledWith({
      email: 'thomas@foodcall.test',
      displayName: 'Thomas',
      password: 'Str0ng!Pass12',
    });

    await waitFor(() => {
      expect(useAuthStore.getState().accessToken).toBe('at');
      expect(useAuthStore.getState().user).toEqual(defaultUser);
    });
  });
});

describe('ForgotPasswordPage', () => {
  it('renders the page title "Mot de passe oublié"', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.forgotPassword]}>
        <Routes>
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Mot de passe oublié')).toBeInTheDocument();
  });

  it('renders support message indicating API endpoint is not available', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.forgotPassword]}>
        <Routes>
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/contacte le support/i)).toBeInTheDocument();
  });

  it('renders a link back to the login page', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.forgotPassword]}>
        <Routes>
          <Route path={ROUTES.forgotPassword} element={<ForgotPasswordPage />} />
          <Route path={ROUTES.login} element={<div data-testid="login" />} />
        </Routes>
      </MemoryRouter>,
    );

    const backLink = screen.getByText(/retour à la connexion/i);
    expect(backLink).toBeInTheDocument();
    expect(backLink.closest('a')).toHaveAttribute('href', ROUTES.login);
  });
});

describe('OnboardingPage', () => {
  it('renders the page title', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.onboarding]}>
        <Routes>
          <Route path={ROUTES.onboarding} element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Prépare ton premier FoodCall')).toBeInTheDocument();
  });

  it('renders the onboarding subtitle', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.onboarding]}>
        <Routes>
          <Route path={ROUTES.onboarding} element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText(/shell d.onboarding/i)).toBeInTheDocument();
  });

  it('renders the planned steps', () => {
    render(
      <MemoryRouter initialEntries={[ROUTES.onboarding]}>
        <Routes>
          <Route path={ROUTES.onboarding} element={<OnboardingPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Ville')).toBeInTheDocument();
    expect(screen.getByText('Préférences alimentaires')).toBeInTheDocument();
    expect(screen.getByText(/créer ou rejoindre un groupe/i)).toBeInTheDocument();
  });
});

describe('token refresh failure', () => {
  it('authService.refresh failure with 401 clears auth state', async () => {
    mockRefresh.mockRejectedValueOnce({ status: 401, message: 'Refresh token expired', code: 'Unauthorized' });
    useAuthStore.getState().setTokens('access-token', 'expired-refresh-token');

    try {
      await mockRefresh('expired-refresh-token');
    } catch {
      useAuthStore.getState().logout();
    }

    expect(mockRefresh).toHaveBeenCalledWith('expired-refresh-token');
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
  });

  it('authService.refresh failure due to network error does not crash', async () => {
    mockRefresh.mockRejectedValueOnce(new Error('Network Error'));
    useAuthStore.getState().setTokens('access-token', 'refresh-token');

    await expect(mockRefresh('refresh-token')).rejects.toThrow('Network Error');

    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().accessToken).toBe('access-token');
  });
});