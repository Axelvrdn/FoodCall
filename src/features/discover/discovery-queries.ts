import {
  useRestaurantsSearchQuery,
  useRestaurantsNearbyQuery,
  useGeocodeQuery,
  useRestaurantQuery,
  useExternalRestaurantsSearchQuery,
  useImportExternalRestaurantMutation,
} from '@/features/server-state';
import type { GeocodeResult } from '@/types/api';

export {
  useRestaurantsSearchQuery,
  useRestaurantsNearbyQuery,
  useGeocodeQuery,
  useRestaurantQuery as useRestaurantDetailQuery,
  useExternalRestaurantsSearchQuery as useExternalRestaurantSearchQuery,
  useImportExternalRestaurantMutation,
};

const GEOCODE_MIN_LENGTH = 2;
const DISCOVERY_STALE_MS = 1000 * 60 * 2;

type GeocodeResultWithCoords = GeocodeResult & {
  lat: number;
  lng: number;
  formattedAddress: string;
};

function hasCoords(result: GeocodeResult): result is GeocodeResultWithCoords {
  return typeof result.lat === 'number' && typeof result.lng === 'number';
}

export function useDiscoveryGeocode(addressQuery: string) {
  const trimmed = addressQuery.trim();
  const enabled = trimmed.length >= GEOCODE_MIN_LENGTH;

  return useGeocodeQuery(trimmed, {
    enabled,
    staleTime: DISCOVERY_STALE_MS,
  });
}

export function useDiscoveryNearby(
  coords: { lat: number; lng: number } | null,
  radius?: number,
  cursor?: string,
  limit?: number,
) {
  return useRestaurantsNearbyQuery(
    coords
      ? { lat: coords.lat, lng: coords.lng, radius, limit, cursor }
      : { lat: NaN, lng: NaN, radius, limit, cursor },
    {
      enabled: coords !== null && !isNaN(coords.lat) && !isNaN(coords.lng),
      staleTime: DISCOVERY_STALE_MS,
    },
  );
}

export function useDiscoverySearch(
  q?: string,
  cursor?: string,
  limit?: number,
) {
  return useRestaurantsSearchQuery(q, cursor, limit, {
    staleTime: DISCOVERY_STALE_MS,
  });
}

export { hasCoords, GEOCODE_MIN_LENGTH };
export type { GeocodeResultWithCoords };