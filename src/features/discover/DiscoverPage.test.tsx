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
        http.get(`${BASE}/restaurants/nearby`, () =>
          HttpResponse.json(paginate(restaurantFixtures.slice(0, 3)))),
      );

      const input = screen.getByPlaceholderText(/adresse/i);
      await userEvent.type(input, 'Paris');
      await userEvent.click(screen.getByRole('button', { name: /trouver/i }));

      await waitFor(() => {
        expect(screen.getByText('Le Petit Bistrot Lillois')).toBeInTheDocument();
      });
    });
  });

  describe('nearby success', () => {
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
        expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
        expect(screen.getByText('Le Petit Bistrot Lillois')).toBeInTheDocument();
      });

      expect(screen.getByText('250 m')).toBeInTheDocument();
      expect(screen.getByText('380 m')).toBeInTheDocument();

      vi.restoreAllMocks();
    });

    it('shows address when distance is unavailable', async () => {
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
        expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
      });

      expect(screen.getByText('1 Rue Nationale, Lille')).toBeInTheDocument();

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
        expect(screen.getByText('Lille Kebab Express')).toBeInTheDocument();
        expect(screen.getByText('Le Petit Bistrot Lillois')).toBeInTheDocument();
      });

      const loadMoreButton = screen.getByText(/afficher plus/i);
      await userEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(requestCount).toBe(2);
        expect(secondPageCursor).not.toBeNull();
      });

      await waitFor(() => {
        expect(screen.getByText('La Table de Lille')).toBeInTheDocument();
        expect(screen.getByText('Au Vieux Lille Gastronomique')).toBeInTheDocument();
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