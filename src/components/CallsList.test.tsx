import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '@/mocks/server';
import { callFixtures, paginate } from '@/mocks/fixtures';
import { CallsList } from './CallsList';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
  };
}

describe('CallsList', () => {
  it('labels current user calls as Vous and other calls with compact user identifiers', async () => {
    const calls = callFixtures.filter((call) => call.sessionId === 'session-monday').slice(0, 2);
    server.use(
      http.get(`${BASE}/sessions/:sessionId/calls`, () => HttpResponse.json(paginate(calls))),
    );

    render(
      <CallsList sessionId="session-monday" sessionState="completed" currentUserId="user-alice" />,
      { wrapper: createWrapper() },
    );

    expect(await screen.findByText('Vous')).toBeInTheDocument();
    expect(screen.getByText('Utilisateur user-ben')).toBeInTheDocument();
    expect(screen.queryByText(/^user-alice$/)).not.toBeInTheDocument();
  });
});
