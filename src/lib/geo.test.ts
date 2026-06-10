import { describe, expect, it } from 'vitest';
import { calculateDistanceMeters, formatOptionalDistance, getRestaurantCoordinates, getRestaurantDistanceMeters } from './geo';
import type { Restaurant } from '@/types/api';

const restaurant = (overrides: Partial<Restaurant>): Restaurant => ({
  id: 'rest-test',
  name: 'Restaurant test',
  description: null,
  address: '1 Rue Nationale, Lille',
  latitude: '50.632000',
  longitude: '3.060000',
  cuisineTags: [],
  photoUrls: [],
  phone: null,
  website: null,
  createdBy: 'user-test',
  createdAt: '2026-05-01T10:00:00.000Z',
  ...overrides,
});

describe('geo utilities', () => {
  it('calculates a Haversine distance in meters', () => {
    const distance = calculateDistanceMeters(
      { lat: 50.6292, lng: 3.0573 },
      { lat: 50.632, lng: 3.06 },
    );

    expect(distance).toBe(365);
  });

  it('parses restaurant coordinates from API string fields', () => {
    expect(getRestaurantCoordinates(restaurant({ latitude: '50.632000', longitude: '3.060000' }))).toEqual({
      lat: 50.632,
      lng: 3.06,
    });
  });

  it('returns null for invalid restaurant coordinates', () => {
    expect(getRestaurantCoordinates(restaurant({ latitude: '', longitude: '' }))).toBeNull();
  });

  it('formats known distances and unknown distances honestly', () => {
    expect(formatOptionalDistance(250)).toBe('250 m');
    expect(formatOptionalDistance(1200)).toBe('1,2 km');
    expect(formatOptionalDistance(null)).toBe('Distance inconnue');
  });

  it('can ignore a provided distance when the active origin must be authoritative', () => {
    const distance = getRestaurantDistanceMeters(
      restaurant({ latitude: '50.632000', longitude: '3.060000', distanceMeters: 12 }),
      { lat: 50.6292, lng: 3.0573 },
      { preferProvidedDistance: false },
    );

    expect(distance).toBe(365);
  });
});
