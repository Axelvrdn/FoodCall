import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { defaultUser } from '@/mocks/fixtures';
import { useAuthStore } from '@/stores/auth-store';
import { ProfilePage } from './ProfilePage';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

describe('ProfilePage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
    useAuthStore.getState().setTokens('test-access', 'test-refresh');
    useAuthStore.getState().setUser(defaultUser);
  });

  it('renders display name, email, avatar initial, and reputation score', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByDisplayValue('alice@example.com')).toBeInTheDocument();
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByText(/1.+200/)).toBeInTheDocument();
  });

  it('renders avatar image when user has an avatarUrl', () => {
    useAuthStore.getState().setUser({ ...defaultUser, avatarUrl: 'https://example.com/avatars/alice.jpg' });
    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();
  });

  it('submits display name and email, calls updateMe, and shows success message', async () => {
    const user = userEvent.setup();
    server.use(
      http.patch(`${BASE}/users/me`, async ({ request }) => {
        const body = await request.json() as Record<string, unknown>;
        return HttpResponse.json({ ...defaultUser, ...body });
      }),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    const nameInput = screen.getByLabelText('Nom affiché');
    const emailInput = screen.getByLabelText('Adresse e-mail');

    await user.clear(nameInput);
    await user.type(nameInput, 'Alice D.');
    await user.clear(emailInput);
    await user.type(emailInput, 'alice.d@example.com');
    await user.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() => {
      expect(screen.getByText('Profil mis à jour.')).toBeInTheDocument();
    });

    const storeUser = useAuthStore.getState().user;
    expect(storeUser?.displayName).toBe('Alice D.');
    expect(storeUser?.email).toBe('alice.d@example.com');
  });

  it('selecting a valid image file calls uploadAvatar with base64 JSON', async () => {
    const user = userEvent.setup();
    server.use(
      http.post(`${BASE}/users/me/avatar`, async () => {
        return HttpResponse.json({ ...defaultUser, avatarUrl: 'https://example.com/avatars/new.png' }, { status: 201 });
      }),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    const file = new File(['fake-image-data'], 'photo.jpg', { type: 'image/jpeg' });
    const fileInput = screen.getByLabelText('Changer la photo');
    await user.upload(fileInput, file);

    await waitFor(() => {
      const storeUser = useAuthStore.getState().user;
      expect(storeUser?.avatarUrl).toBe('https://example.com/avatars/new.png');
    });
  });

  it('selecting a non-image or unsupported type shows error and does not call service', () => {
    render(<ProfilePage />, { wrapper: createWrapper() });

    const file = new File(['not-an-image'], 'document.txt', { type: 'text/plain' });
    const fileInput = screen.getByTestId('avatar-input') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      configurable: true,
    });
    fireEvent.change(fileInput);

    expect(screen.getByRole('alert')).toHaveTextContent('Formats accept');
  });

  it('deletes avatar, calls deleteAvatar, and removes image preview', async () => {
    const user = userEvent.setup();
    useAuthStore.getState().setUser({ ...defaultUser, avatarUrl: 'https://example.com/avatars/alice.jpg' });

    server.use(
      http.delete(`${BASE}/users/me/avatar`, () => {
        return HttpResponse.json({ ...defaultUser, avatarUrl: null });
      }),
    );

    render(<ProfilePage />, { wrapper: createWrapper() });

    expect(screen.getByRole('img', { name: 'Alice' })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Supprimer la photo' }));

    await waitFor(() => {
      const storeUser = useAuthStore.getState().user;
      expect(storeUser?.avatarUrl).toBeNull();
    });
  });
});