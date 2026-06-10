import { formatDistance } from './formatters';
import type { Restaurant } from '@/types/api';

export interface Coordinates {
  lat: number;
  lng: number;
}

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function calculateDistanceMeters(from: Coordinates, to: Coordinates): number {
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);

  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(EARTH_RADIUS_METERS * c);
}

export function getRestaurantCoordinates(restaurant: Restaurant): Coordinates | null {
  const lat = Number.parseFloat(restaurant.latitude);
  const lng = Number.parseFloat(restaurant.longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export function getRestaurantDistanceMeters(
  restaurant: Restaurant,
  origin: Coordinates | null,
  options: { preferProvidedDistance?: boolean } = {},
): number | null {
  const preferProvidedDistance = options.preferProvidedDistance ?? true;

  if (preferProvidedDistance && typeof restaurant.distanceMeters === 'number' && Number.isFinite(restaurant.distanceMeters)) {
    return restaurant.distanceMeters;
  }

  if (!origin) return null;

  const destination = getRestaurantCoordinates(restaurant);
  if (!destination) return null;

  return calculateDistanceMeters(origin, destination);
}

export function formatOptionalDistance(distanceMeters: number | null | undefined): string {
  if (typeof distanceMeters !== 'number' || !Number.isFinite(distanceMeters)) {
    return 'Distance inconnue';
  }

  return formatDistance(distanceMeters);
}
