import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import {
  useSessionRecommendationsQuery,
  useGroupRecommendationsQuery,
} from '@/features/server-state';
import { recommendationFixtures, apiErrors } from '@/mocks/fixtures';
import type { RecommendationItem } from '@/types/api';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

function cursorPage<T>(items: T[], nextCursor: string | null = null) {
  return { data: items, meta: { nextCursor } };
}

describe('recommendation query hooks', () => {
  beforeEach(() => server.resetHandlers());

  describe('useSessionRecommendations', () => {
    it('is disabled when sessionId is undefined', () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery(undefined as unknown as string),
        { wrapper: createWrapper() },
      );
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('returns ranked session recommendations when sessionId is defined', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-friday'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data[0].rank).toBe(1);
      expect(result.current.data?.data[0].score).toBe(0.89);
    });

    it('returns explanation with components', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-friday'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const components = result.current.data?.data[0].explanation.components;
      expect(components).toHaveLength(4);
      expect(components![0].key).toBe('restaurantScore');
      expect(components![0].weight).toBe(0.5);
    });

    it('handles loading state', () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, async () => new Promise(() => {})),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-friday'),
        { wrapper: createWrapper() },
      );
      expect(result.current.isLoading).toBe(true);
    });

    it('handles error state', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.unauthorized(), { status: 401 })),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-friday'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toMatchObject({ status: 401 });
    });

    it('handles empty recommendations', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage<RecommendationItem>([]))),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-empty'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(0);
    });

    it('supports pagination metadata', async () => {
      server.use(
        http.get(`${BASE}/sessions/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures.slice(0, 1), 'next-cursor'))),
      );
      const { result } = renderHook(
        () => useSessionRecommendationsQuery('session-friday', 1),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.meta.nextCursor).toBe('next-cursor');
    });
  });

  describe('useGroupRecommendations', () => {
    it('is disabled when groupId is undefined', () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery(undefined as unknown as string),
        { wrapper: createWrapper() },
      );
      expect(result.current.fetchStatus).toBe('idle');
    });

    it('returns group recommendations when groupId is defined', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures))),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery('group-lille'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(2);
      expect(result.current.data?.data[0].restaurant.name).toBeTruthy();
    });

    it('handles loading state', () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, async () => new Promise(() => {})),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery('group-lille'),
        { wrapper: createWrapper() },
      );
      expect(result.current.isLoading).toBe(true);
    });

    it('handles error state', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(apiErrors.forbidden(), { status: 403 })),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery('group-lille'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toMatchObject({ status: 403 });
    });

    it('handles empty recommendations', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage<RecommendationItem>([]))),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery('group-empty'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(0);
    });

    it('supports pagination metadata', async () => {
      server.use(
        http.get(`${BASE}/groups/:id/recommendations`, () =>
          HttpResponse.json(cursorPage(recommendationFixtures, 'next-cursor'))),
      );
      const { result } = renderHook(
        () => useGroupRecommendationsQuery('group-lille'),
        { wrapper: createWrapper() },
      );
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.meta.nextCursor).toBe('next-cursor');
    });
  });
});
