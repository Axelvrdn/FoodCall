import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { useAuthStore } from '@/stores/auth-store';
import {
  restaurantFixtures,
  externalRestaurantFixtures,
  importResponseFixture,
  apiErrors,
  paginate,
  emptyPage,
} from '@/mocks/fixtures';
import { RestaurantDetailPage } from './RestaurantDetailPage';
import { ExternalRestaurantPanel } from './ExternalRestaurantPanel';
import type { ExternalRestaurant, ExternalRestaurantImportResponse } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(qc?: QueryClient, initialEntries?: string[]) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      { initialEntries },
      createElement(
        QueryClientProvider,
        { client },
        createElement(Routes, null,
          createElement(Route, { path: '/restaurants/:id', element: children }),
          createElement(Route, { path: '/decouvrir', element: <div>Discovery</div> }),
        ),
      ),
    );
  };
}

function createPanelWrapper(qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(
      MemoryRouter,
      null,
      createElement(QueryClientProvider, { client }, children),
    );
  };
}

describe('RestaurantDetailPage', () => {
  beforeEach(() => {
    server.resetHandlers();
    useAuthStore.getState().logout();
  });

  describe('success', () => {
    it('renders restaurant details', async () => {
      const restaurant = restaurantFixtures[0];
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: restaurant.name })).toBeInTheDocument();
      });

      expect(screen.getByText(restaurant.address)).toBeInTheDocument();
      expect(screen.getByText('fast-food')).toBeInTheDocument();
      expect(screen.getByText('kebab')).toBeInTheDocument();
    });

    it('renders phone and website when present', async () => {
      const restaurant = {
        ...restaurantFixtures[0],
        phone: '+33 1 23 45 67 89',
        website: 'https://example.com',
      };
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => {
        expect(screen.getByText(/\+33 1 23 45 67 89/)).toBeInTheDocument();
      });

      expect(screen.getByText('https://example.com')).toBeInTheDocument();
    });

    it('renders rating when available', async () => {
      const restaurant = restaurantFixtures[2]; // has rating
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-marcel']),
      });

      await waitFor(() => {
        expect(screen.getByText(/1\.3/)).toBeInTheDocument();
      });

      expect(screen.getByText(/3 avis/)).toBeInTheDocument();
    });

    it('lets the creator update restaurant details inline', async () => {
      const user = userEvent.setup();
      const restaurant = restaurantFixtures[0];
      let currentRestaurant = restaurant;
      let capturedName: string | null = null;

      useAuthStore.getState().setUser({ id: restaurant.createdBy, email: 'alice@example.com', displayName: 'Alice', avatarUrl: null, reputationScore: 1200, createdAt: restaurant.createdAt, updatedAt: restaurant.createdAt });
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(currentRestaurant)),
        http.patch(`${BASE}/restaurants/:id`, async ({ request }) => {
          const body = await request.json() as { name?: string };
          capturedName = body.name ?? null;
          currentRestaurant = { ...currentRestaurant, ...body };
          return HttpResponse.json(currentRestaurant);
        }),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => expect(screen.getByRole('heading', { name: restaurant.name })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: 'Modifier le restaurant' }));
      const nameInput = screen.getByLabelText('Nom du restaurant');
      await user.clear(nameInput);
      await user.type(nameInput, 'Lille Kebab Updated');
      await user.click(screen.getByRole('button', { name: 'Enregistrer le restaurant' }));

      await waitFor(() => expect(capturedName).toBe('Lille Kebab Updated'));
      await waitFor(() => expect(screen.getByRole('heading', { name: 'Lille Kebab Updated' })).toBeInTheDocument());
    });

    it('lets the creator delete a restaurant after confirmation', async () => {
      const user = userEvent.setup();
      const restaurant = restaurantFixtures[0];
      let deletedRestaurantId: string | null = null;

      useAuthStore.getState().setUser({ id: restaurant.createdBy, email: 'alice@example.com', displayName: 'Alice', avatarUrl: null, reputationScore: 1200, createdAt: restaurant.createdAt, updatedAt: restaurant.createdAt });
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
        http.delete(`${BASE}/restaurants/:id`, ({ params }) => {
          deletedRestaurantId = String(params['id']);
          return new HttpResponse(null, { status: 204 });
        }),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => expect(screen.getByRole('heading', { name: restaurant.name })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: 'Supprimer le restaurant' }));
      await user.click(screen.getByRole('button', { name: 'Confirmer la suppression du restaurant' }));

      await waitFor(() => expect(deletedRestaurantId).toBe('rest-kebab'));
      await waitFor(() => expect(screen.getByText('Discovery')).toBeInTheDocument());
    });

    it('keeps a default MSW deleted restaurant unavailable after remount', async () => {
      const user = userEvent.setup();
      const restaurant = restaurantFixtures[0];

      useAuthStore.getState().setUser({ id: restaurant.createdBy, email: 'alice@example.com', displayName: 'Alice', avatarUrl: null, reputationScore: 1200, createdAt: restaurant.createdAt, updatedAt: restaurant.createdAt });
      const firstClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const { unmount } = render(<RestaurantDetailPage />, {
        wrapper: createWrapper(firstClient, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => expect(screen.getByRole('heading', { name: restaurant.name })).toBeInTheDocument());
      await user.click(screen.getByRole('button', { name: 'Supprimer le restaurant' }));
      await user.click(screen.getByRole('button', { name: 'Confirmer la suppression du restaurant' }));
      await waitFor(() => expect(screen.getByText('Discovery')).toBeInTheDocument());

      unmount();
      const secondClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(secondClient, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/introuvable/i);
    });
  });

  describe('no rating', () => {
    it('renders honest no-reviews state when count is 0', async () => {
      const restaurant = {
        ...restaurantFixtures[0],
        rating: { average: null, count: 0 },
      };
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => {
        expect(screen.getByText(/aucun avis pour le moment/i)).toBeInTheDocument();
      });
    });

    it('renders no-reviews state when rating is absent', async () => {
      const restaurant = { ...restaurantFixtures[0] };
      delete (restaurant as Record<string, unknown>).rating;
      server.use(
        http.get(`${BASE}/restaurants/:id`, () => HttpResponse.json(restaurant)),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      await waitFor(() => {
        expect(screen.getByText(/aucun avis pour le moment/i)).toBeInTheDocument();
      });
    });
  });

  describe('loading', () => {
    it('renders loading indicator', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return HttpResponse.json(restaurantFixtures[0]);
        }),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const status = await screen.findByRole('status');
      expect(status).toHaveTextContent(/chargement du restaurant/i);
    });
  });

  describe('404', () => {
    it('renders recoverable not-found message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.notFound('Restaurant'), { status: 404 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/unknown']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/introuvable/i);

      const backLink = screen.getByText(/retour à la découverte/i);
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('403', () => {
    it('renders recoverable permission-denied message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.forbidden(), { status: 403 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/autorisation/i);

      const backLink = screen.getByText(/retour à la découverte/i);
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('401', () => {
    it('renders recoverable auth-required message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.unauthorized(), { status: 401 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/authentication/i);

      const backLink = screen.getByText(/retour à la découverte/i);
      expect(backLink).toBeInTheDocument();
    });
  });

  describe('409', () => {
    it('renders conflict error message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.conflict(), { status: 409 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/already exists|conflit/i);
    });
  });

  describe('429', () => {
    it('renders rate-limit error message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.rateLimit(), { status: 429 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/too many|requêtes/i);
    });
  });

  describe('server error', () => {
    it('renders recoverable error message', async () => {
      server.use(
        http.get(`${BASE}/restaurants/:id`, () =>
          HttpResponse.json(apiErrors.providerFailure(), { status: 503 })),
      );

      render(<RestaurantDetailPage />, {
        wrapper: createWrapper(undefined, ['/restaurants/rest-kebab']),
      });

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/unavailable|indisponible|erreur de chargement/i);
    });
  });
});

describe('ExternalRestaurantPanel', () => {
  beforeEach(() => server.resetHandlers());

  describe('search success', () => {
    it('renders external candidates with provider label', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      expect(screen.getAllByText(/candidat externe — google/i).length).toBe(2);
      expect(screen.getByText('Sushi Zen Paris')).toBeInTheDocument();
    });

    it('caps limit at 20', async () => {
      let capturedLimit: string | null = null;

      server.use(
        http.get(`${BASE}/external-restaurants/search`, ({ request }) => {
          const url = new URL(request.url);
          capturedLimit = url.searchParams.get('limit');
          return HttpResponse.json(paginate(externalRestaurantFixtures));
        }),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      const limitInput = screen.getByLabelText(/limite/i);
      await userEvent.tripleClick(limitInput);
      await userEvent.type(limitInput, '{backspace}{backspace}50');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      expect(capturedLimit).toBe('20');
    });
  });

  describe('empty search', () => {
    it('renders empty message when no candidates found', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(emptyPage<ExternalRestaurant>())),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText(/aucun candidat externe trouvé/i)).toBeInTheDocument();
      });
    });
  });

  describe('provider timeout/quota errors', () => {
    it('renders retry for 502 provider failure', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    });

    it('renders retry for 503 provider failure', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(apiErrors.providerFailure('google'), { status: 503 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    });

    it('renders retry for 504 provider failure', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);
      expect(screen.getByRole('button', { name: /réessayer/i })).toBeInTheDocument();
    });

    it('renders rate-limit message for 429', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(apiErrors.rateLimit(), { status: 429 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/trop|requêtes/i);
    });
  });

  describe('safe import payload', () => {
    it('sends only provider and providerPlaceId in import body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(importResponseFixture, { status: 201 });
        }),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });

      expect(capturedBody).toHaveProperty('provider');
      expect(capturedBody).toHaveProperty('providerPlaceId');
      expect(capturedBody).not.toHaveProperty('name');
      expect(capturedBody).not.toHaveProperty('address');
      expect(capturedBody).not.toHaveProperty('latitude');
      expect(capturedBody).not.toHaveProperty('longitude');
      expect(capturedBody).not.toHaveProperty('phone');
      expect(capturedBody).not.toHaveProperty('website');
      expect(capturedBody).not.toHaveProperty('cuisineTags');
    });

    it('does not include sessionId when not provided', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(importResponseFixture, { status: 201 });
        }),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });

      expect(capturedBody).toHaveProperty('provider');
      expect(capturedBody).toHaveProperty('providerPlaceId');
      expect(capturedBody).not.toHaveProperty('sessionId');
    });
  });

  describe('audit display', () => {
    it('shows audit fields after successful import', async () => {
      const response: ExternalRestaurantImportResponse = {
        ...importResponseFixture,
        matchedBy: 'name-address',
        restaurantCreated: true,
        sourceLinked: true,
        sourceAction: 'created',
        candidateAdded: false,
        transactional: true,
      };

      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, () =>
          HttpResponse.json(response, { status: 201 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/import réussi/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/Correspondance : name-address/)).toBeInTheDocument();
      expect(screen.getByText(/Restaurant créé : Oui/)).toBeInTheDocument();
      expect(screen.getByText(/Source liée : Oui/)).toBeInTheDocument();
      expect(screen.getByText(/Action source : created/)).toBeInTheDocument();
      expect(screen.getByText(/Candidat ajouté : Non/)).toBeInTheDocument();
      expect(screen.getByText(/Transactionnel : Oui/)).toBeInTheDocument();
    });

    it('shows link to imported restaurant when available', async () => {
      const response: ExternalRestaurantImportResponse = {
        ...importResponseFixture,
        restaurant: { ...importResponseFixture.restaurant, id: 'rest-imported-123' },
      };

      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, () =>
          HttpResponse.json(response, { status: 201 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(screen.getByText(/voir le restaurant importé/i)).toBeInTheDocument();
      });

      const link = screen.getByText(/voir le restaurant importé/i);
      expect(link.getAttribute('href')).toBe('/restaurants/rest-imported-123');
    });
  });

  describe('duplicate candidate 409', () => {
    it('renders conflict message when import returns 409', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, () =>
          HttpResponse.json(apiErrors.conflict('Restaurant already imported'), { status: 409 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/déjà présent|conflit/i);
    });
  });

  describe('provider failure on import', () => {
    it('renders retry for 502 external import failure', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, () =>
          HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);
    });

    it('renders retry for 504 external import failure', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, () =>
          HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 })),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);
    });
  });

  describe('no provider metadata in trust claims', () => {
    it('does not send normalized provider fields in import body', async () => {
      let capturedBody: Record<string, unknown> | null = null;

      server.use(
        http.get(`${BASE}/external-restaurants/search`, () =>
          HttpResponse.json(paginate(externalRestaurantFixtures))),
        http.post(`${BASE}/external-restaurants/import`, async ({ request }) => {
          capturedBody = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(importResponseFixture, { status: 201 });
        }),
      );

      render(<ExternalRestaurantPanel />, { wrapper: createPanelWrapper() });

      await userEvent.type(screen.getByLabelText(/latitude/i), '48.8566');
      await userEvent.type(screen.getByLabelText(/longitude/i), '2.3522');
      await userEvent.click(screen.getByRole('button', { name: /rechercher/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Comptoir du Panthéon')).toBeInTheDocument();
      });

      const importButton = screen.getAllByRole('button', { name: /importer/i })[0];
      await userEvent.click(importButton);

      await waitFor(() => {
        expect(capturedBody).not.toBeNull();
      });

      // Strict check: only provider, providerPlaceId allowed (no sessionId in this test)
      expect(Object.keys(capturedBody!).sort()).toEqual(['provider', 'providerPlaceId']);
    });
  });
});
