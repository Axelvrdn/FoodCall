import { describe, expect, it, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { recommendationsService } from '@/services/domain-services';
import { recommendationFixtures, apiErrors, paginate } from '@/mocks/fixtures';
import type { RecommendationItem } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function cursorPage<T>(items: T[], nextCursor: string | null = null) {
  return { data: items, meta: { nextCursor } };
}

describe('recommendationsService', () => {
  beforeEach(() => server.resetHandlers());

  describe('forSession', () => {
    it('returns ranked session candidates with explanations', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const result = await recommendationsService.forSession('session-friday');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].score).toBe(0.89);
      expect(result.data[0].restaurant).toBeDefined();
      expect(result.data[0].restaurant.name).toBe('Au Vieux Lille Gastronomique');
      expect(result.data[0].explanation.summary).toBeTruthy();
      expect(result.data[0].explanation.components).toHaveLength(4);
    });

    it('returns explanation components with correct weights', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const result = await recommendationsService.forSession('session-friday');
      const components = result.data[0].explanation.components;
      expect(components[0].key).toBe('restaurantScore');
      expect(components[0].weight).toBe(0.5);
      expect(components[1].key).toBe('distance');
      expect(components[1].weight).toBe(0.3);
      expect(components[2].key).toBe('budget');
      expect(components[2].weight).toBe(0.15);
      expect(components[3].key).toBe('history');
      expect(components[3].weight).toBe(0.05);
    });

    it('supports pagination with cursor and nextCursor', async () => {
      const page1 = recommendationFixtures.slice(0, 1);
      const page2 = recommendationFixtures.slice(1);
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, ({ request }) => {
          const url = new URL(request.url);
          const cursor = url.searchParams.get('cursor');
          if (cursor === 'next') {
            return HttpResponse.json(cursorPage(page2, null));
          }
          return HttpResponse.json(cursorPage(page1, 'next'));
        }),
      );
      const result1 = await recommendationsService.forSession('session-friday', 1);
      expect(result1.data).toHaveLength(1);
      expect(result1.meta.nextCursor).toBe('next');

      const result2 = await recommendationsService.forSession('session-friday', 1, 'next');
      expect(result2.data).toHaveLength(1);
      expect(result2.meta.nextCursor).toBeNull();
    });

    it('handles empty recommendations', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage<RecommendationItem>([]))),
      );
      const result = await recommendationsService.forSession('session-empty');
      expect(result.data).toHaveLength(0);
      expect(result.meta.nextCursor).toBeNull();
    });

    it('handles 401 unauthorized error', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.unauthorized(), { status: 401 })),
      );
      await expect(recommendationsService.forSession('session-friday')).rejects.toMatchObject({ status: 401 });
    });

    it('handles 403 forbidden error', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.forbidden('Not a group member'), { status: 403 })),
      );
      await expect(recommendationsService.forSession('session-friday')).rejects.toMatchObject({ status: 403 });
    });

    it('handles 404 not found error', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.notFound('Session'), { status: 404 })),
      );
      await expect(recommendationsService.forSession('nonexistent')).rejects.toMatchObject({ status: 404 });
    });
  });

  describe('forGroup', () => {
    it('returns ranked group recommendations with explanations', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const result = await recommendationsService.forGroup('group-lille');
      expect(result.data).toHaveLength(2);
      expect(result.data[0].rank).toBe(1);
      expect(result.data[0].score).toBe(0.89);
      expect(result.data[0].restaurant.name).toBeTruthy();
      expect(result.data[0].explanation).toBeDefined();
    });

    it('supports pagination with cursor and nextCursor', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, ({ request }) => {
          const url = new URL(request.url);
          const cursor = url.searchParams.get('cursor');
          if (cursor) {
            return HttpResponse.json(cursorPage<RecommendationItem>([], null));
          }
          return HttpResponse.json(cursorPage(recommendationFixtures.slice(0, 1), 'next'));
        }),
      );
      const result1 = await recommendationsService.forGroup('group-lille', 1);
      expect(result1.meta.nextCursor).toBe('next');

      const result2 = await recommendationsService.forGroup('group-lille', 1, 'next');
      expect(result2.data).toHaveLength(0);
      expect(result2.meta.nextCursor).toBeNull();
    });

    it('handles 400 error when no default start location', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, ({ params }) => {
          if (params['id'] === 'group-lyon') {
            return HttpResponse.json(
              apiErrors.validation({ location: 'Aucun lieu de depart defini pour ce groupe' }),
              { status: 400 },
            );
          }
          return HttpResponse.json(cursorPage(recommendationFixtures));
        }),
      );
      await expect(recommendationsService.forGroup('group-lyon')).rejects.toMatchObject({ status: 400 });
    });

    it('handles 401 unauthorized error', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.unauthorized(), { status: 401 })),
      );
      await expect(recommendationsService.forGroup('group-lille')).rejects.toMatchObject({ status: 401 });
    });

    it('handles 403 forbidden error', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.forbidden('Not a group member'), { status: 403 })),
      );
      await expect(recommendationsService.forGroup('group-lille')).rejects.toMatchObject({ status: 403 });
    });

    it('handles 404 not found error', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.notFound('Group'), { status: 404 })),
      );
      await expect(recommendationsService.forGroup('nonexistent')).rejects.toMatchObject({ status: 404 });
    });

    it('handles empty recommendations', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage<RecommendationItem>([]))),
      );
      const result = await recommendationsService.forGroup('group-lille');
      expect(result.data).toHaveLength(0);
      expect(result.meta.nextCursor).toBeNull();
    });
  });
});
