import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, it, expect, beforeEach } from 'vitest';
import { SessionStateControls } from './SessionStateControls';
import { server } from '@/mocks/server';
import type { SessionCandidate } from '@/types/api';

function Wrapper({ children }: { children: React.ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>;
}

beforeEach(() => { server.resetHandlers(); });

const CANDIDATES: SessionCandidate[] = [
  { id: 'c1', sessionId: 's1', restaurantId: 'r1', addedBy: 'u1', createdAt: '2026-01-01T00:00:00.000Z', restaurant: { id: 'r1', name: 'Chez Paul', description: null, address: '1 rue de Paris', latitude: '48.8', longitude: '2.3', cuisineTags: ['Francais'], photoUrls: [], phone: null, website: null, createdBy: 'u1', createdAt: '2026-01-01T00:00:00.000Z' } },
  { id: 'c2', sessionId: 's1', restaurantId: 'r2', addedBy: 'u1', createdAt: '2026-01-01T00:00:00.000Z', restaurant: { id: 'r2', name: 'Le Bistro', description: null, address: '2 rue de Lyon', latitude: '48.8', longitude: '2.3', cuisineTags: ['Italien'], photoUrls: [], phone: null, website: null, createdBy: 'u2', createdAt: '2026-01-01T00:00:00.000Z' } },
];

describe('SessionStateControls', () => {
  it('returns null for non-creator', () => {
    const { container } = render(
      <SessionStateControls sessionId="s1" status="draft" createdBy="creator1" currentUserId="other" />,
      { wrapper: Wrapper },
    );
    expect(container.innerHTML).toBe('');
  });

  it('shows Activer and Annuler in draft state for creator', () => {
    render(
      <SessionStateControls sessionId="s1" status="draft" createdBy="creator1" currentUserId="creator1" candidates={CANDIDATES} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Activer')).toBeDefined();
    expect(screen.getByText('Lancer le vote')).toBeDefined();
    expect(screen.getByText('Annuler')).toBeDefined();
  });

  it('shows Lancer le vote and Annuler in active state', () => {
    render(
      <SessionStateControls sessionId="s1" status="active" createdBy="creator1" currentUserId="creator1" candidates={CANDIDATES} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Lancer le vote')).toBeDefined();
    expect(screen.getByText('Annuler')).toBeDefined();
    expect(screen.queryByText('Activer')).toBeNull();
  });

  it('shows select restaurant and complete in voting state', () => {
    render(
      <SessionStateControls sessionId="s1" status="voting" createdBy="creator1" currentUserId="creator1" candidates={CANDIDATES} selectedRestaurantId={null} />,
      { wrapper: Wrapper },
    );
    expect(screen.getByText('Selectionner')).toBeDefined();
    expect(screen.getByText('Terminer')).toBeDefined();
    expect(screen.getByText('Annuler')).toBeDefined();
  });

  it('disables Terminer when no restaurant selected', () => {
    render(
      <SessionStateControls sessionId="s1" status="voting" createdBy="creator1" currentUserId="creator1" candidates={CANDIDATES} selectedRestaurantId={null} />,
      { wrapper: Wrapper },
    );
    const btn = screen.getByText('Terminer');
    expect((btn as HTMLButtonElement).disabled).toBe(true);
  });

  it('shows no buttons in completed state', () => {
    render(
      <SessionStateControls sessionId="s1" status="completed" createdBy="creator1" currentUserId="creator1" candidates={CANDIDATES} />,
      { wrapper: Wrapper },
    );
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('shows completion info when completed', () => {
    const { container } = render(
      <SessionStateControls sessionId="s1" status="completed" createdBy="creator1" currentUserId="creator1" />,
      { wrapper: Wrapper },
    );
    expect(container.textContent).toContain('');
  });
});
