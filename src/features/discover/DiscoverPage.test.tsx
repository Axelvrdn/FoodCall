import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { restaurantFixtures, paginate, geocodeFixture, apiErrors } from '@/mocks/fixtures';
import { DiscoverPage } from './DiscoverPage';
import type { Restaurant } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper(qc?: QueryClient) {
  const client = qc ?? new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(MemoryRouter, null, createElement(QueryClientProvider, { client }, children));
  };
}

const mockGeolocation = (coords: { latitude: number; longitude: number }) => ({
  getCurrentPosition: vi.fn((_success: PositionCallback, _error?: PositionErrorCallback) => {
    void _error;
    _success({
      coords: { latitude: coords.latitude, longitude: coords.longitude, accuracy: 10 },
      timestamp: Date.now(),
    } as GeolocationPosition);
  }),
});

const mockGeolocationDenied = () => ({
  getCurrentPosition: vi.fn((_success: PositionCallback, error?: PositionErrorCallback) => {
    error?.({
      code: 1,
      message: 'User denied Geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    } as GeolocationPositionError);
  }),
});

async function clickGeolocate() {
  await userEvent.click(screen.getByRole('button', { name: /autour de moi/i }));
}

describe('DiscoverPage', () => {
  beforeEach(() => server.resetHandlers());

  describe('geocode query gating', () => {
    it('disables geocode when address has fewer than 2 characters', async () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const spy = vi.spyOn(qc, 'fetchQuery');
      render(<DiscoverPage />, { wrapper: createWrapper(qc) });
      const input = screen.getByPlaceholderText(/adresse/i);
      await userEvent.type(input, 'a');
      expect(spy).not.toHaveBeenCalled();
      spy.mockRestore();
    });
  });

  describe('nearby query gating', () => {
    it('does not fetch nearby when coordinates are unavailable', () => {
      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(<DiscoverPage />, { wrapper: createWrapper(qc) });
      const nearbyCache = qc.getQueryData(['restaurants', 'nearby']);
      expect(nearbyCache).toBeUndefined();
    });
  });

  describe('query key stability', () => {
    it('includes all relevant params in nearby query keys', async () => {
      const coords = { lat: 50.6292, lng: 3.0573 };
      const mockGeo = mockGeolocation({ latitude: coords.lat, longitude: coords.lng });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      render(<DiscoverPage />, { wrapper: createWrapper(qc) });
      await clickGeolocate();

      await waitFor(() => {
        const keys = qc.getQueryCache().getAll().map((q) => q.queryKey);
        const nearbyKey = keys.find((k) => {
          const params = k[2] as { lat?: number; lng?: number } | undefined;
          return k[0] === 'restaurants' && k[1] === 'nearby' && params?.lat === coords.lat && params?.lng === coords.lng;
        });
        expect(nearbyKey).toBeDefined();
        expect(nearbyKey![2]).toMatchObject({ lat: coords.lat, lng: coords.lng });
      });

      vi.restoreAllMocks();
    });
  });

  describe('geolocation denial', () => {
    it('renders fallback message when geolocation is denied', async () => {
      const mockGeo = mockGeolocationDenied();
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/localisation/i);
      expect(alert).toHaveTextContent(/adresse/i);

      vi.restoreAllMocks();
    });
  });

  describe('typed address search', () => {
    it('triggers geocode and nearby search on address submit', async () => {
      render(<DiscoverPage />, { wrapper: createWrapper() });

      server.use(
        http.get(`${BASE}/geo/geocode`, () => HttpResponse.json([geocodeFixture])),
        http.get(`${BASE}/restaurants/search`, () =>
          HttpResponse.json({ data: [], meta: { nextCursor: null } })),
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures.slice(0, 3)))),
      );

      const input = screen.getByPlaceholderText(/adresse/i);
      await userEvent.type(input, 'Paris');
      await userEvent.click(screen.getByRole('button', { name: /trouver/i }));

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument();
      });
    });

    it('sends the typed restaurant search query and changes results by query', async () => {
      const user = userEvent.setup();
      const seenQueries: string[] = [];

      server.use(
        http.get(`${BASE}/restaurants/search`, ({ request }) => {
          const url = new URL(request.url);
          const q = url.searchParams.get('q') ?? '';
          seenQueries.push(q);

          const restaurants = restaurantFixtures.filter((restaurant) =>
            restaurant.name.toLowerCase().includes(q.toLowerCase()) ||
            restaurant.cuisineTags.some((tag) => tag.toLowerCase().includes(q.toLowerCase())) ||
            restaurant.address.toLowerCase().includes(q.toLowerCase()),
          );

          return HttpResponse.json(paginate(restaurants));
        }),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText(/adresse/i);
      await user.type(input, 'kebab');
      await user.click(screen.getByRole('button', { name: /trouver/i }));

      await waitFor(() => {
        expect(seenQueries).toContain('kebab');
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
      });
      expect(screen.queryByRole('heading', { name: 'Le Petit Bistrot Lillois' })).not.toBeInTheDocument();

      await user.clear(input);
      await user.type(input, 'bistrot');
      await user.click(screen.getByRole('button', { name: /trouver/i }));

      await waitFor(() => {
        expect(seenQueries).toContain('bistrot');
        expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument();
      });
      expect(screen.queryByRole('heading', { name: 'Lille Kebab Express' })).not.toBeInTheDocument();
    });

    it('recalculates searched restaurant distance from the active geocoded origin instead of trusting stale fixture distances', async () => {
      const user = userEvent.setup();

      server.use(
        http.get(`${BASE}/geo/geocode`, () => HttpResponse.json([{ lat: 48.8566, lng: 2.3522, formattedAddress: 'Paris' }])),
        http.get(`${BASE}/restaurants/search`, () => HttpResponse.json(paginate([restaurantFixtures[1]]))),
        http.get(`${BASE}/restaurants/nearby`, () => HttpResponse.json({ data: [], meta: { nextCursor: null } })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });

      const input = screen.getByPlaceholderText(/adresse/i);
      await user.type(input, 'bistrot');
      await user.click(screen.getByRole('button', { name: /trouver/i }));

      await waitFor(() => expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument());

      expect(screen.getByText('203,3 km')).toBeInTheDocument();
      expect(screen.queryByText('380 m')).not.toBeInTheDocument();
    });
  });

  describe('nearby success', () => {
    it('renders nearby backend projections that omit optional restaurant arrays', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json({
            data: [
              {
                id: 'rest-live-projection',
                name: 'Live Backend Projection',
                address: '1 Rue Runtime, Lille',
                latitude: '50.629200',
                longitude: '3.057300',
                createdAt: '2026-06-01T12:00:00.000Z',
                distanceMeters: 128,
              },
            ],
            meta: { nextCursor: null },
          })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Live Backend Projection' })).toBeInTheDocument();
      });
      expect(screen.getByText('128 m')).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('renders a restaurant map surface instead of the prototype placeholder', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures.slice(0, 2)))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument());
      expect(screen.getByRole('region', { name: /carte des restaurants/i })).toBeInTheDocument();
      expect(screen.getByTestId('restaurant-map-nowebgl')).toBeInTheDocument();
      expect(screen.queryByText(/carte en préparation/i)).not.toBeInTheDocument();
      expect(screen.getByText(/2 restaurants issus de l.api/i)).toBeInTheDocument();
      expect(screen.queryByText('MapPlaceholder')).not.toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('renders restaurant cards with distance', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures.slice(0, 3)))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument();
      });

      expect(screen.getByText('250 m')).toBeInTheDocument();
      expect(screen.getByText('380 m')).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('calculates distance from active coordinates when backend distance is unavailable', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      const noDistance: Restaurant[] = restaurantFixtures.slice(0, 1).map((r) => ({
        ...r,
        distanceMeters: undefined,
      }));

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(noDistance))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
      });

      expect(screen.getByText('365 m')).toBeInTheDocument();
      expect(screen.queryByText('Distance inconnue')).not.toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('shows an honest unknown distance label when distance cannot be calculated', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      const noCoordinates: Restaurant[] = restaurantFixtures.slice(0, 1).map((r) => ({
        ...r,
        latitude: '',
        longitude: '',
        distanceMeters: undefined,
      }));

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(noCoordinates))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
      });

      expect(screen.getByText('Distance inconnue')).toBeInTheDocument();

      vi.restoreAllMocks();
    });
  });

  describe('empty state', () => {
    it('renders empty message when no restaurants found', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json({ data: [], meta: { nextCursor: null } })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByText(/aucun restaurant/i)).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });
  });

  describe('provider failure taxonomy', () => {
    it('renders retry for 502 provider failure', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);

      vi.restoreAllMocks();
    });

    it('renders retry for 503 provider failure', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(apiErrors.providerFailure('google'), { status: 503 })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);

      vi.restoreAllMocks();
    });

    it('renders retry for 504 provider failure', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/indisponible|réessaie/i);

      vi.restoreAllMocks();
    });
  });

  describe('rate limiting', () => {
    it('renders specific rate-limit message for 429', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(apiErrors.rateLimit(), { status: 429 })),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const alert = await screen.findByRole('alert');
      expect(alert).toHaveTextContent(/trop|requêtes/i);

      vi.restoreAllMocks();
    });
  });

  describe('restaurant card links', () => {
    it('links restaurant cards to detail route', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures.slice(0, 2)))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        const links = screen.getAllByRole('link');
        expect(links.some((l) => l.getAttribute('href')?.includes('/restaurants/'))).toBe(true);
      });

      vi.restoreAllMocks();
    });
  });

  describe('pagination', () => {
    it('renders Afficher plus when nextCursor is non-null', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures, undefined, 10))),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByText(/afficher plus/i)).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it('loads second page when Afficher plus is clicked', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      let requestCount = 0;
      let secondPageCursor: string | null = null;
      const page1 = restaurantFixtures.slice(0, 3);
      const page2 = restaurantFixtures.slice(3, 5);

      server.use(
        http.get(`${BASE}/restaurants/nearby`, ({ request }) => {
          requestCount++;
          const url = new URL(request.url);
          const cursor = url.searchParams.get('cursor');
          if (!cursor) {
            return HttpResponse.json(paginate(page1, undefined, 2));
          }
          secondPageCursor = cursor;
          return HttpResponse.json(paginate(page2, undefined, 2));
        }),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/afficher plus/i);
      await userEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(requestCount).toBe(2);
        expect(secondPageCursor).not.toBeNull();
      });

      await waitFor(() => {
        expect(screen.getByRole('heading', { name: 'La Table de Lille' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Au Vieux Lille Gastronomique' })).toBeInTheDocument();
        // Page 1 restaurants should still be visible (accumulation)
        expect(screen.getByRole('heading', { name: 'Lille Kebab Express' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'Le Petit Bistrot Lillois' })).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });
  });

  describe('loading state', () => {
    it('renders loading indicator', async () => {
      const mockGeo = mockGeolocation({ latitude: 50.6292, longitude: 3.0573 });
      vi.stubGlobal('navigator', { ...navigator, geolocation: mockGeo });

      server.use(
        http.get(`${BASE}/restaurants/nearby`, async () => {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          return HttpResponse.json(paginate(restaurantFixtures));
        }),
      );

      render(<DiscoverPage />, { wrapper: createWrapper() });
      await clickGeolocate();

      const loading = await screen.findByRole('status');
      expect(loading).toHaveTextContent(/chargement/i);

      vi.restoreAllMocks();
    });
  });
});
