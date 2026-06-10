import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { RestaurantMap } from './RestaurantMap';
import type { Restaurant } from '@/types/api';

// Mock maplibre-gl
const mockRemove = vi.fn();
const mockOn = vi.fn();
const mockAddControl = vi.fn();
const mockResize = vi.fn();
const mockMarker = {
  setLngLat: vi.fn().mockReturnThis(),
  setPopup: vi.fn().mockReturnThis(),
  addTo: vi.fn().mockReturnThis(),
};
const mockPopup = {
  setText: vi.fn().mockReturnThis(),
};

vi.mock('maplibre-gl', () => ({
  Map: vi.fn().mockImplementation(function () {
    return {
    on: mockOn,
    addControl: mockAddControl,
    resize: mockResize,
    remove: mockRemove,
    };
  }),
  NavigationControl: vi.fn().mockImplementation(function () {
    return {};
  }),
  Marker: vi.fn().mockImplementation(function () {
    return mockMarker;
  }),
  Popup: vi.fn().mockImplementation(function () {
    return mockPopup;
  }),
}));

// Mock getRestaurantCoordinates
vi.mock('@/lib', () => ({
  getRestaurantCoordinates: vi.fn().mockImplementation((restaurant: Restaurant) => ({
    lat: restaurant.latitude ?? 50.62925,
    lng: restaurant.longitude ?? 3.057256,
  })),
}));

describe('RestaurantMap', () => {
  let originalGetContext: typeof HTMLCanvasElement.prototype.getContext;

  const restaurantFixture: Restaurant = {
    id: 'r1',
    name: 'Le Petit Bistrot',
    description: null,
    address: '45 Rue de la Monnaie, Lille',
    latitude: '50.630000',
    longitude: '3.060000',
    cuisineTags: ['bistro'],
    photoUrls: [],
    phone: null,
    website: null,
    createdBy: 'user-alice',
    createdAt: '2026-04-03T10:05:00.000Z',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
      if (contextId === 'webgl' || contextId === 'experimental-webgl' || contextId === 'webgl2') {
        return {} as unknown as RenderingContext;
      }
      return originalGetContext.call(document.createElement('canvas'), contextId);
    }) as unknown as typeof HTMLCanvasElement.prototype.getContext;
    mockOn.mockImplementation((event: string, handler: () => void) => {
      if (event === 'load') {
        setTimeout(() => handler(), 10);
      }
    });
  });

  afterEach(() => {
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('initialise la carte quand WebGL est disponible et affiche les markers', async () => {
    const origin = { lat: 50.62925, lng: 3.057256 };
    const restaurants: Restaurant[] = [restaurantFixture];

    render(<RestaurantMap origin={origin} restaurants={restaurants} detail="Restaurants autour de toi" />);

    // Attendre que la carte soit initialisée
    await waitFor(() => {
      expect(screen.getByTestId('restaurant-map-canvas')).toBeInTheDocument();
    });

    // Vérifier que le badge indique MapLibre
    await waitFor(() => {
      expect(screen.getByText('MapLibre')).toBeInTheDocument();
    });

    // Vérifier que les markers sont ajoutés
    expect(mockMarker.setLngLat).toHaveBeenCalled();
    expect(mockMarker.addTo).toHaveBeenCalled();
  });

  it('affiche le fallback "Mode limité" quand WebGL n\'est pas disponible', () => {
    // Simuler l'absence de WebGL
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(null);

    const origin = { lat: 50.62925, lng: 3.057256 };
    const restaurants: Restaurant[] = [];

    render(<RestaurantMap origin={origin} restaurants={restaurants} detail="Restaurants autour de toi" />);

    // Vérifier que le fallback s'affiche
    expect(screen.getByTestId('restaurant-map-nowebgl')).toBeInTheDocument();
    expect(screen.getByText('Mode limité')).toBeInTheDocument();

    // Restaurer
    HTMLCanvasElement.prototype.getContext = originalGetContext;
  });

  it('affiche une erreur quand MapLibre émet une erreur réelle', async () => {
    mockOn.mockImplementation((event: string, handler: (e: unknown) => void) => {
      if (event === 'error') {
        setTimeout(() => handler({ error: new Error('Style JSON invalide') }), 20);
      }
    });

    const origin = { lat: 50.62925, lng: 3.057256 };
    const restaurants: Restaurant[] = [];

    render(<RestaurantMap origin={origin} restaurants={restaurants} detail="Restaurants autour de toi" />);

    await waitFor(() => {
      expect(screen.getByTestId('restaurant-map-error')).toBeInTheDocument();
    });

    expect(screen.getByText('Erreur')).toBeInTheDocument();
    expect(screen.getByText('Style JSON invalide')).toBeInTheDocument();
  });

  it('affiche le fallback d\'aperçu quand il n\'y a pas d\'origine', () => {
    const restaurants: Restaurant[] = [
      restaurantFixture,
    ];

    render(<RestaurantMap origin={null} restaurants={restaurants} detail="Restaurants autour de toi" />);

    expect(screen.getByTestId('restaurant-map-fallback')).toBeInTheDocument();
    expect(screen.getByText('Aperçu')).toBeInTheDocument();
  });
});
