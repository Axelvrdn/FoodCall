import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  groupsService,
  groupMembersService,
  groupInvitesService,
  restaurantsService,
  externalRestaurantsService,
  sessionsService,
  candidatesService,
  votesService,
  callsService,
  callFeedbackService,
  reviewsService,
  recommendationsService,
  geoService,
} from './domain-services';

const BASE = 'http://localhost:3000/api';

function cursorPage<T>(items: T[], nextCursor: string | null = null) {
  return { data: items, meta: { nextCursor } };
}

describe('domain services', () => {
  beforeEach(() => server.resetHandlers());

  describe('groups', () => {
    it('lists groups with cursor pagination', async () => {
      server.use(
        http.get(`${BASE}/groups`, () => HttpResponse.json(cursorPage([{ id: 'g1', name: 'Test', description: null, role: 'owner' as const, budgetMax: '15.00', createdAt: '2024-01-15T10:30:00.000Z' }]))),
      );
      const result = await groupsService.list();
      expect(result.data).toHaveLength(1);
      expect(result.data[0].role).toBe('owner');
    });

    it('gets a group by id', async () => {
      server.use(
        http.get(`${BASE}/groups/g1`, () => HttpResponse.json({ id: 'g1', name: 'Lunch Crew', description: null, createdBy: 'u1', budgetMax: '15.00', defaultStartAddress: 'Paris', defaultStartLatitude: '48.856600', defaultStartLongitude: '2.352200', defaultSearchRadiusMeters: 1500, createdAt: '2024-01-15T10:30:00.000Z', updatedAt: '2024-01-15T10:30:00.000Z', deletedAt: null })),
      );
      const group = await groupsService.get('g1');
      expect(group.id).toBe('g1');
      expect(group.defaultStartLatitude).toBe('48.856600');
    });

    it('creates a group', async () => {
      server.use(
        http.post(`${BASE}/groups`, async () => HttpResponse.json({ id: 'g2', name: 'New', description: null, createdBy: 'u1', budgetMax: '20.00', defaultStartAddress: null, defaultStartLatitude: null, defaultStartLongitude: null, defaultSearchRadiusMeters: 2000, createdAt: '2024-02-01T00:00:00.000Z', updatedAt: '2024-02-01T00:00:00.000Z', deletedAt: null }, { status: 201 })),
      );
      const group = await groupsService.create({ name: 'New', budgetMax: 20, defaultStartLatitude: 48.8, defaultStartLongitude: 2.3 });
      expect(group.id).toBe('g2');
    });

    it('handles 409 conflict on group create', async () => {
      server.use(
        http.post(`${BASE}/groups`, () => HttpResponse.json({ statusCode: 409, message: 'Nom déjà pris', error: 'Conflict' }, { status: 409 })),
      );
      await expect(groupsService.create({ name: 'Duplicate' })).rejects.toMatchObject({ status: 409 });
    });
  });

  describe('group members', () => {
    it('lists members of a group', async () => {
      server.use(
        http.get(`${BASE}/groups/g1/members`, () => HttpResponse.json([{ id: 'gm1', groupId: 'g1', userId: 'u1', role: 'owner', joinedAt: '2024-01-15T10:30:00.000Z' }])),
      );
      const members = await groupMembersService.list('g1');
      expect(members).toHaveLength(1);
      expect(members[0].role).toBe('owner');
    });

    it('updates a member role through the central group-member role route', async () => {
      server.use(
        http.patch(`${BASE}/groups/g1/members/u2/role`, async ({ request }) => {
          const body = await request.json() as { role: string };
          expect(body.role).toBe('admin');
          return HttpResponse.json({ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'admin', joinedAt: '2024-01-16T10:00:00.000Z' });
        }),
      );

      const member = await groupMembersService.updateRole('g1', 'u2', 'admin');
      expect(member.role).toBe('admin');
    });

    it('removes a member through the central group-member remove route', async () => {
      server.use(
        http.delete(`${BASE}/groups/g1/members/u2`, () => new HttpResponse(null, { status: 204 })),
      );

      await expect(groupMembersService.remove('g1', 'u2')).resolves.toBeUndefined();
    });
  });

  describe('group invites', () => {
    it('creates an invite for a group', async () => {
      server.use(
        http.post(`${BASE}/groups/g1/invites`, () => HttpResponse.json({ id: 'inv1', groupId: 'g1', code: 'ABC123', expiresAt: '2024-12-31T23:59:59.000Z', maxUses: 10, currentUses: 0, createdAt: '2024-01-15T10:30:00.000Z' }, { status: 201 })),
      );
      const invite = await groupInvitesService.create('g1');
      expect(invite.code).toBe('ABC123');
    });

    it('joins a group with an invite code', async () => {
      server.use(
        http.post(`${BASE}/groups/join`, () => HttpResponse.json({ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'member', joinedAt: '2024-01-16T10:00:00.000Z' }, { status: 201 })),
      );
      const member = await groupInvitesService.join('ABC123');
      expect(member.role).toBe('member');
    });

    it('handles 404 on invalid invite code', async () => {
      server.use(
        http.post(`${BASE}/groups/join`, () => HttpResponse.json({ statusCode: 404, message: 'Not found', error: 'Not Found' }, { status: 404 })),
      );
      await expect(groupInvitesService.join('INVALID')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('restaurants', () => {
    it('searches restaurants', async () => {
      server.use(
        http.get(`${BASE}/restaurants/search`, () => HttpResponse.json(cursorPage([{ id: 'r1', name: 'Le Petit Bistro', description: '', address: '1 Rue Paris', latitude: '48.856600', longitude: '2.352200', cuisineTags: ['French'], photoUrls: [], phone: '', website: '', createdBy: 'u1', createdAt: '2024-01-01T00:00:00.000Z' }]))),
      );
      const result = await restaurantsService.search('bistro');
      expect(result.data).toHaveLength(1);
    });

    it('handles 400 on invalid nearby params', async () => {
      server.use(
        http.get(`${BASE}/restaurants/nearby`, () => HttpResponse.json({ statusCode: 400, message: 'Validation error', error: 'Bad Request' }, { status: 400 })),
      );
      await expect(restaurantsService.nearby(NaN, NaN)).rejects.toMatchObject({ status: 400 });
    });

    it('updates a restaurant through the central restaurant route', async () => {
      server.use(
        http.patch(`${BASE}/restaurants/r1`, async ({ request }) => {
          const body = await request.json() as { name?: string; latitude?: number; longitude?: number };
          expect(body).toMatchObject({ name: 'Bistro Updated', latitude: 48.8, longitude: 2.3 });
          return HttpResponse.json({ id: 'r1', name: 'Bistro Updated', description: null, address: '1 Rue Paris', latitude: '48.800000', longitude: '2.300000', cuisineTags: ['French'], photoUrls: [], phone: null, website: null, createdBy: 'u1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' });
        }),
      );

      const restaurant = await restaurantsService.update('r1', { name: 'Bistro Updated', latitude: 48.8, longitude: 2.3 });
      expect(restaurant.name).toBe('Bistro Updated');
    });

    it('deletes a restaurant through the central restaurant route', async () => {
      server.use(
        http.delete(`${BASE}/restaurants/r1`, () => new HttpResponse(null, { status: 204 })),
      );

      await expect(restaurantsService.delete('r1')).resolves.toBeUndefined();
    });

    it('updates a restaurant through the default MSW handler', async () => {
      const restaurant = await restaurantsService.update('rest-kebab', { name: 'Lille Kebab Updated' });

      expect(restaurant.id).toBe('rest-kebab');
      expect(restaurant.name).toBe('Lille Kebab Updated');
    });

    it('deletes a restaurant through the default MSW handler', async () => {
      await expect(restaurantsService.delete('rest-kebab')).resolves.toBeUndefined();
    });
  });

  describe('external restaurants', () => {
    it('searches external restaurants', async () => {
      server.use(
        http.get(`${BASE}/external-restaurants/search`, () => HttpResponse.json(cursorPage([{ sourceId: 'ext1', source: 'google', name: 'External Place', address: '2 Rue Test', latitude: 48.8, longitude: 2.3, cuisineTags: ['Italian'], rating: 4.5 }]))),
      );
      const result = await externalRestaurantsService.search({ lat: 48.8, lng: 2.3 });
      expect(result.data).toHaveLength(1);
      expect(typeof result.data[0].latitude).toBe('number');
    });

    it('imports an external restaurant', async () => {
      server.use(
        http.post(`${BASE}/external-restaurants/import`, () => HttpResponse.json({ restaurantId: 'r2', matchedBy: 'none', restaurantCreated: true, sourceLinked: true, sourceAction: 'created', transactional: true })),
      );
      const result = await externalRestaurantsService.import({ provider: 'google', providerPlaceId: 'ext1' });
      expect(result.restaurantCreated).toBe(true);
    });
  });

  describe('sessions', () => {
    it('lists sessions for a group', async () => {
      server.use(
        http.get(`${BASE}/groups/g1/sessions`, () => HttpResponse.json(cursorPage([{ id: 's1', name: 'Lunch Today', description: null, groupId: 'g1', status: 'active', voteType: 'approval', createdBy: 'u1', startAddress: 'Paris', startLatitude: '48.856600', startLongitude: '2.352200', searchRadiusMeters: 1500, budgetMax: '15.00', selectedRestaurantId: null, deadline: null, completedAt: null, createdAt: '2024-01-15T10:30:00.000Z', updatedAt: '2024-01-15T10:30:00.000Z', deletedAt: null }]))),
      );
      const result = await sessionsService.list('g1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].startLatitude).toBe('48.856600');
    });

    it('starts voting on a session', async () => {
      server.use(
        http.post(`${BASE}/sessions/s1/start-voting`, () => HttpResponse.json({ id: 's1', name: 'Lunch', status: 'voting', groupId: 'g1', voteType: 'approval', createdBy: 'u1', startAddress: 'Paris', startLatitude: '48.856600', startLongitude: '2.352200', searchRadiusMeters: 1500, budgetMax: '15.00', selectedRestaurantId: null, deadline: null, completedAt: null, createdAt: '2024-01-15T10:30:00.000Z', updatedAt: '2024-01-15T11:00:00.000Z', deletedAt: null })),
      );
      const session = await sessionsService.startVoting('s1');
      expect(session.status).toBe('voting');
    });

    it('handles 403 on unauthorized session transition', async () => {
      server.use(
        http.post(`${BASE}/sessions/s1/start-voting`, () => HttpResponse.json({ statusCode: 403, message: 'Forbidden', error: 'Forbidden' }, { status: 403 })),
      );
      await expect(sessionsService.startVoting('s1')).rejects.toMatchObject({ status: 403 });
    });
  });

  describe('candidates', () => {
    it('adds a candidate to a session', async () => {
      server.use(
        http.post(`${BASE}/sessions/s1/candidates`, () => HttpResponse.json({ id: 'c1', sessionId: 's1', restaurantId: 'r1', addedBy: 'u1', createdAt: '2024-01-15T11:00:00.000Z' }, { status: 201 })),
      );
      const candidate = await candidatesService.add('s1', 'r1');
      expect(candidate.restaurantId).toBe('r1');
    });
  });

  describe('votes', () => {
    it('casts a vote', async () => {
      server.use(
        http.post(`${BASE}/sessions/s1/votes`, () => HttpResponse.json({ id: 'v1', sessionId: 's1', candidateId: 'c1', userId: 'u1', value: 1, createdAt: '2024-01-15T11:30:00.000Z' }, { status: 201 })),
      );
      const vote = await votesService.cast('s1', 'c1');
      expect(vote.candidateId).toBe('c1');
    });

    it('gets vote results', async () => {
      server.use(
        http.get(`${BASE}/sessions/s1/results`, () => HttpResponse.json([{ candidateId: 'c1', restaurantId: 'r1', restaurantName: 'Le Bistro', votes: 3, creatorApproved: true }])),
      );
      const results = await votesService.results('s1');
      expect(results).toHaveLength(1);
      expect(results[0].votes).toBe(3);
    });

    it('deletes a vote through the central session vote detail route', async () => {
      server.use(
        http.delete(`${BASE}/sessions/s1/votes/v1`, () => new HttpResponse(null, { status: 204 })),
      );

      await expect(votesService.delete('s1', 'v1')).resolves.toBeUndefined();
    });
  });

  describe('calls', () => {
    it('creates a call', async () => {
      server.use(
        http.post(`${BASE}/sessions/s1/calls`, () => HttpResponse.json({ id: 'call1', sessionId: 's1', restaurantId: 'r1', userId: 'u1', pitch: 'Great place!', createdAt: '2024-01-15T12:00:00.000Z' }, { status: 201 })),
      );
      const call = await callsService.create('s1', { restaurantId: 'r1', pitch: 'Great place!' });
      expect(call.pitch).toBe('Great place!');
    });

    it('deletes a call', async () => {
      server.use(
        http.delete(`${BASE}/calls/c1`, () => new HttpResponse(null, { status: 204 })),
      );
      await expect(callsService.delete('c1')).resolves.toBeUndefined();
    });
  });

  describe('call feedback', () => {
    it('creates feedback for a call', async () => {
      server.use(
        http.post(`${BASE}/calls/call1/feedback`, () => HttpResponse.json({ id: 'fb1', callId: 'call1', userId: 'u1', rating: 5, comment: 'Excellent!', createdAt: '2024-01-16T10:00:00.000Z' }, { status: 201 })),
      );
      const feedback = await callFeedbackService.create('call1', { rating: 5, comment: 'Excellent!' });
      expect(feedback.rating).toBe(5);
    });

    it('lists feedback for a call', async () => {
      server.use(
        http.get(`${BASE}/calls/call1/feedback`, () => HttpResponse.json([{ id: 'fb1', callId: 'call1', userId: 'u1', rating: 5, comment: 'Great', createdAt: '2024-01-16T10:00:00.000Z' }])),
      );
      const list = await callFeedbackService.list('call1');
      expect(list).toHaveLength(1);
    });
  });

  describe('reviews', () => {
    it('lists reviews for a restaurant', async () => {
      server.use(
        http.get(`${BASE}/restaurants/r1/reviews`, () => HttpResponse.json(cursorPage([{ id: 'rev1', restaurantId: 'r1', userId: 'u1', sessionId: 's1', rating: 4, comment: 'Good food', createdAt: '2024-01-20T10:00:00.000Z', updatedAt: null }]))),
      );
      const result = await reviewsService.list('r1');
      expect(result.data).toHaveLength(1);
    });

    it('handles 503 service unavailable', async () => {
      server.use(
        http.get(`${BASE}/restaurants/r1/reviews`, () => HttpResponse.json({ statusCode: 503, message: 'Service unavailable', error: 'Service Unavailable' }, { status: 503 })),
      );
      await expect(reviewsService.list('r1')).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('recommendations', () => {
    it('gets recommendations for a session', async () => {
      server.use(
        http.get(`${BASE}/sessions/s1/recommendations`, () => HttpResponse.json(cursorPage([{ restaurantId: 'r1', score: 95, explanation: [{ key: 'restaurantScore', score: 90, weight: 0.5, contribution: 45, reason: 'High quality' }] }]))),
      );
      const result = await recommendationsService.forSession('s1');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].score).toBe(95);
    });
  });

  describe('geo', () => {
    it('geocodes an address', async () => {
      server.use(
        http.get(`${BASE}/geo/geocode`, () => HttpResponse.json({ address: 'Paris, France', latitude: '48.856600', longitude: '2.352200' })),
      );
      const result = await geoService.geocode('Paris');
      expect(result.latitude).toBe('48.856600');
    });

    it('gets a route', async () => {
      server.use(
        http.get(`${BASE}/geo/route`, () => HttpResponse.json({ distance: 1250, duration: 180 })),
      );
      const result = await geoService.route({ fromLat: 48.8566, fromLng: 2.3522, toLat: 48.86, toLng: 2.36 });
      expect(result.distance).toBe(1250);
      expect(typeof result.duration).toBe('number');
    });

    it('handles 429 rate limit on geocode', async () => {
      server.use(
        http.get(`${BASE}/geo/geocode`, () => HttpResponse.json({ statusCode: 429, message: 'Too many requests', error: 'Too Many Requests' }, { status: 429 })),
      );
      await expect(geoService.geocode('test')).rejects.toMatchObject({ status: 429 });
    });
  });
});
