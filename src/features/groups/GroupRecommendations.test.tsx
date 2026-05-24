import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import { userFixtures } from '@/mocks/fixtures';
import { GroupRecommendationsPage } from './GroupRecommendations';

function createWrapper(initialEntries: string[] = ['/groupes/group-lille/recommendations']) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries },
        createElement(Routes, null,
          createElement(Route, { path: '/groupes/:groupId/recommendations', element: children }),
        ),
      ),
    );
  };
}

describe('GroupRecommendationsPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
  });

  it('uses the groupId route param to load recommendations', async () => {
    useAuthStore.getState().setUser(userFixtures[0]);
    render(createElement(GroupRecommendationsPage), { wrapper: createWrapper() });

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Recommandations pour Lille Lunch Crew' })).toBeInTheDocument());
    expect(screen.queryByText('Identifiant de groupe manquant.')).not.toBeInTheDocument();
  });
});
