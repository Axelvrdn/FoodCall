import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '@/mocks/server';
import { GroupCreatePage } from './GroupCreatePage';
import { GroupsPage } from './GroupsPage';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      QueryClientProvider,
      { client: qc },
      createElement(MemoryRouter, { initialEntries: ['/groupes/nouveau'] },
        createElement(Routes, null,
          createElement(Route, { path: '/groupes/nouveau', element: children }),
          createElement(Route, { path: '/groupes', element: createElement(GroupsPage) }),
          createElement(Route, { path: '/groupes/:id', element: createElement('h1', null, 'Détail du nouveau groupe') }),
        ),
      ),
    );
  };
}

describe('GroupCreatePage', () => {
  beforeEach(() => server.resetHandlers());

  it('persists the created group and redirects to its backend detail route', async () => {
    const user = userEvent.setup();
    render(createElement(GroupCreatePage), { wrapper: createWrapper() });

    await user.type(screen.getByLabelText('Nom du groupe'), 'Roubaix Lunch Club');
    await user.type(screen.getByLabelText('Description'), 'Choisir un restaurant autour de Roubaix.');
    await user.type(screen.getByLabelText('Budget maximum (EUR)'), '24');
    await user.click(screen.getByRole('button', { name: 'Créer le groupe' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Détail du nouveau groupe' })).toBeInTheDocument());
  });
});
