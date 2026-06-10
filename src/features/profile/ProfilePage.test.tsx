import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { http, HttpResponse } from 'msw';
import { ROUTES } from '@/lib';
import { server } from '@/mocks/server';
import { defaultUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/api';
import { ProfilePage } from './ProfilePage';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, null,
      createElement(QueryClientProvider, { client: qc }, children),
    );
  };
}

function currentUser(overrides: Partial<User> = {}): User {
  return {
    ...defaultUser,
    id: 'user-chloe',
    email: 'chloe@example.com',
    displayName: 'Chloe Martin',
    avatarUrl: null,
    reputationScore: 1500,
    createdAt: '2026-04-10T07:00:00.000Z',
    updatedAt: '2026-05-18T10:00:00.000Z',
    ...overrides,
  };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
    useAuthStore.getState().setTokens('test-access', 'test-refresh');
    useAuthStore.getState().setUser(defaultUser);
  });

  it('renders a social profile from the connected /users/me data instead of stale local defaults', async () => {
    const backendUser = currentUser();
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json(backendUser)),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByRole('heading', { name: backendUser.displayName })).toBeInTheDocument();
    expect(screen.getByText(backendUser.email)).toBeInTheDocument();
    expect(screen.getByText('CM')).toBeInTheDocument();
    expect(screen.getByText('Membre depuis avril 2026')).toBeInTheDocument();
    expect(screen.getByText('1 500')).toBeInTheDocument();
    expect(screen.getByText('Score renvoyé par /users/me')).toBeInTheDocument();
    expect(useAuthStore.getState().user?.id).toBe(backendUser.id);
  });

  it('uses the shared FoodCall animated background in the profile banner without changing profile content', async () => {
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json(currentUser())),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByRole('heading', { name: 'Chloe Martin' });

    const background = screen.getByTestId('foodcall-animated-background');
    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(background).toHaveClass('foodcall-animated-background');
    expect(background).toHaveClass('foodcall-animated-background--profile');
    expect(background).toHaveAttribute('data-reactbits-source', 'Grainient');
    expect(background).toHaveAttribute('data-animation-engine', 'ogl-grainient');
    expect(background).toHaveAttribute('data-animation-intensity', 'reactbits-reference');
    expect(background).toHaveAttribute('data-grainient-colors', '#EAB308,#F97316,#EF4444');
    expect(background).toHaveAttribute('data-grainient-grain', '0');
    expect(background).toHaveAttribute('data-grainient-saturation', '2.35');
    expect(background).toHaveAttribute('data-grainient-warp', '2.15/3.9/73');
    expect(screen.getByTestId('profile-identity-card')).toHaveClass('relative', 'z-10');
    expect(screen.getByRole('link', { name: 'Paramètres du compte' })).toHaveAttribute('href', ROUTES.settings);
  });

  it('keeps private account settings out of /profil and links to /parametres instead', async () => {
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json(currentUser())),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByRole('heading', { name: 'Chloe Martin' });

    expect(screen.queryByLabelText('Adresse e-mail')).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Nom affiché')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument();
    expect(screen.queryByText(/mot de passe/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/préférences alimentaires/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/notifications/i)).not.toBeInTheDocument();

    expect(screen.getByRole('link', { name: 'Paramètres du compte' })).toHaveAttribute('href', ROUTES.settings);
  });

  it('shows honest unavailable states for social sections without inventing fake stats or badges', async () => {
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json(currentUser({ reputationScore: 0 }))),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    await screen.findByRole('heading', { name: 'Chloe Martin' });

    for (const tab of ['Aperçu', 'Avis', 'Calls', 'Favoris', 'Groupes', 'Badges']) {
      expect(screen.getByRole('button', { name: tab })).toBeInTheDocument();
    }

    const socialStats = screen.getByLabelText('Statistiques sociales disponibles');
    expect(within(socialStats).getAllByText('—')).toHaveLength(2);
    expect(within(socialStats).getByText('Avis publiés')).toBeInTheDocument();
    expect(within(socialStats).getAllByText('Endpoint non disponible')).toHaveLength(2);
    expect(screen.getByText('Aucun badge affiché')).toBeInTheDocument();
    expect(screen.getByText(/FoodCall n’expose pas encore d’endpoint public pour les badges/i)).toBeInTheDocument();
    expect(screen.queryByText(/expert foodcall/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/top 1%/i)).not.toBeInTheDocument();
  });

  it('renders the persisted avatar image when /users/me returns avatarUrl', async () => {
    server.use(
      http.get(`${BASE}/users/me`, () => HttpResponse.json(currentUser({ avatarUrl: 'https://example.com/avatars/chloe.jpg' }))),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(await screen.findByRole('img', { name: 'Photo de profil de Chloe Martin' })).toHaveAttribute('src', 'https://example.com/avatars/chloe.jpg');
    expect(screen.getByRole('button', { name: 'Changer la photo' })).toBeDisabled();
    expect(screen.getByText(/désactivé ici pour éviter une modification non vérifiée/i)).toBeInTheDocument();
  });
});
