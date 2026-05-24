import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NAV_ITEMS, USER_MENU_ITEMS } from '@/lib';
import { TopBar } from '@/components/layouts';
import { useAuthStore } from '@/stores/auth-store';

vi.mock('@/services/users-service', () => ({
  usersService: { me: vi.fn() },
}));

describe('FoodCall scaffold', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
    vi.clearAllMocks();
  });

  it('keeps product navigation constrained', () => {
    expect(NAV_ITEMS).toHaveLength(4);
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(['Découvrir', 'Groupes', 'Avis', 'Mes calls']);
    expect(USER_MENU_ITEMS.map((item) => item.label)).toEqual(['Profil', 'Paramètres']);
  });

  it('renders TopBar without Profil in main nav', () => {
    useAuthStore.getState().setUser({ id: 'user-test', email: 'test@foodcall.test', displayName: 'Thomas', avatarUrl: null, reputationScore: 1, createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z' });
    render(<MemoryRouter><TopBar /></MemoryRouter>);
    expect(screen.getByRole('navigation', { name: 'Navigation principale' })).toHaveTextContent('DécouvrirGroupesAvisMes calls');
    expect(screen.getByText('Profil')).toBeInTheDocument();
    expect(screen.getByText('Paramètres')).toBeInTheDocument();
  });
});