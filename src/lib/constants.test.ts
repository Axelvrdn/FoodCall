import { describe, expect, it } from 'vitest';
import { API_ROUTES, NAV_ITEMS, ROUTES, USER_MENU_ITEMS, buildApiRoute } from './constants';

describe('navigation constants', () => {
  it('matches product navigation constraints', () => {
    expect(NAV_ITEMS.map((item) => item.label)).toEqual(['Découvrir', 'Groupes', 'Avis', 'Mes calls']);
    expect(USER_MENU_ITEMS.map((item) => item.label)).toEqual(['Profil', 'Paramètres']);
    expect(Object.values(ROUTES)).toEqual(expect.arrayContaining(['/decouvrir', '/parametres', '/mot-de-passe-oublie']));
  });
});

describe('buildApiRoute', () => {
  it('replaces path params', () => {
    expect(buildApiRoute('/groups/:id', { id: 'abc-123' })).toBe('/groups/abc-123');
  });

  it('encodes path params with special characters', () => {
    expect(buildApiRoute('/groups/:groupId/sessions', { groupId: 'g 1' })).toBe('/groups/g%201/sessions');
  });

  it('appends query params', () => {
    const url = buildApiRoute('/groups/:groupId/sessions', { groupId: 'g1' }, { cursor: '2024-01-10T08:00:00.000Z', limit: 20 });
    expect(url).toContain('/groups/g1/sessions?');
    expect(url).toContain('cursor=2024-01-10T08%3A00%3A00.000Z');
    expect(url).toContain('limit=20');
  });

  it('omits null and undefined query params', () => {
    const url = buildApiRoute('/restaurants', undefined, { q: 'pizza', cursor: null, limit: undefined });
    expect(url).toBe('/restaurants?q=pizza');
  });

  it('returns template unchanged when no params or query', () => {
    expect(buildApiRoute('/auth/login')).toBe('/auth/login');
  });

  it('encodes boolean query params', () => {
    const url = buildApiRoute('/external-restaurants/search', undefined, { lat: 48.8566, lng: 2.3522, includeRoute: true });
    expect(url).toContain('includeRoute=true');
  });

  it('builds cursor pagination URLs', () => {
    const url = buildApiRoute(API_ROUTES.groups, undefined, { limit: 20, cursor: '2024-01-10T08:00:00.000Z' });
    expect(url).toContain('/groups?');
    expect(url).toContain('limit=20');
    expect(url).toContain('cursor=');
  });

  it('builds nearby search URL with all params', () => {
    const url = buildApiRoute(API_ROUTES.restaurantsNearby, undefined, { lat: 48.8566, lng: 2.3522, radius: 1000, limit: 10 });
    expect(url).toContain('/restaurants/nearby?');
    expect(url).toContain('lat=48.8566');
    expect(url).toContain('lng=2.3522');
  });

  it('builds group detail route', () => {
    expect(buildApiRoute(API_ROUTES.groupDetail, { id: 'abc' })).toBe('/groups/abc');
  });

  it('builds session candidates route', () => {
    expect(buildApiRoute(API_ROUTES.sessionCandidates, { id: 's1' })).toBe('/sessions/s1/candidates');
  });

  it('builds session votes route', () => {
    expect(buildApiRoute(API_ROUTES.sessionVotes, { id: 's1' })).toBe('/sessions/s1/votes');
  });

  it('builds restaurant reviews route', () => {
    expect(buildApiRoute(API_ROUTES.restaurantReviews, { id: 'r1' })).toBe('/restaurants/r1/reviews');
  });

  it('builds group recommendations route', () => {
    expect(buildApiRoute(API_ROUTES.groupRecommendations, { id: 'g1' }, { limit: 10 })).toContain('/groups/g1/recommendations?limit=10');
  });
});