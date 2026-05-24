import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';
import { queryKeys } from './query-keys';
import {
  useDeleteRestaurantMutation,
  useDeleteVoteMutation,
  useGroupsQuery,
  useInfiniteGroupsQuery,
  useCreateGroupMutation,
  useRemoveGroupMemberMutation,
  useUpdateGroupMemberRoleMutation,
  useUpdateRestaurantMutation,
} from './server-state';

const BASE = 'http://localhost:3000/api';

function createWrapper() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
  return createWrapperWithClient(qc);
}

function createWrapperWithClient(qc: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: qc }, children);
  };
}

function cursorPage<T>(items: T[], nextCursor: string | null = null) {
  return { data: items, meta: { nextCursor } };
}

describe('server-state hooks', () => {
  beforeEach(() => server.resetHandlers());

  describe('useGroupsQuery', () => {
    it('fetches first page of groups', async () => {
      server.use(
        http.get(`${BASE}/groups`, () => HttpResponse.json(cursorPage([{ id: 'g1', name: 'Group 1', role: 'owner' as const, budgetMax: '15.00', createdAt: '2024-01-01T00:00:00.000Z' }]))),
      );
      const { result } = renderHook(() => useGroupsQuery(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.data).toHaveLength(1);
      expect(result.current.data?.data[0].name).toBe('Group 1');
    });
  });

  describe('useInfiniteGroupsQuery', () => {
    it('fetches pages using nextCursor', async () => {
      let callCount = 0;
      server.use(
        http.get(`${BASE}/groups`, ({ request }) => {
          callCount++;
          const url = new URL(request.url);
          const cursor = url.searchParams.get('cursor');
          if (cursor === 'page2') {
            return HttpResponse.json(cursorPage([{ id: 'g3', name: 'Group 3', role: 'member' as const, budgetMax: '20.00', createdAt: '2024-01-03T00:00:00.000Z' }], null));
          }
          return HttpResponse.json(cursorPage([{ id: 'g1', name: 'Group 1', role: 'owner' as const, budgetMax: '15.00', createdAt: '2024-01-01T00:00:00.000Z' }, { id: 'g2', name: 'Group 2', role: 'admin' as const, budgetMax: '10.00', createdAt: '2024-01-02T00:00:00.000Z' }], 'page2'));
        }),
      );

      const { result } = renderHook(() => useInfiniteGroupsQuery(20), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data?.pages).toHaveLength(1);
      expect(result.current.data?.pages[0].data).toHaveLength(2);
      expect(result.current.data?.pages[0].meta.nextCursor).toBe('page2');

      await result.current.fetchNextPage();
      await waitFor(() => expect(result.current.data?.pages).toHaveLength(2));
      expect(callCount).toBe(2);
      expect(result.current.data?.pages[1].data).toHaveLength(1);
      expect(result.current.data?.pages[1].meta.nextCursor).toBeNull();
    });
  });

  describe('useCreateGroupMutation', () => {
    it('invalidates groups query on success', async () => {
      let listCallCount = 0;
      server.use(
        http.get(`${BASE}/groups`, () => {
          listCallCount++;
          return HttpResponse.json(cursorPage([]));
        }),
        http.post(`${BASE}/groups`, () => HttpResponse.json({ id: 'new', name: 'New Group', description: null, createdBy: 'u1', budgetMax: '25.00', defaultStartAddress: null, defaultStartLatitude: null, defaultStartLongitude: null, defaultSearchRadiusMeters: 2000, createdAt: '2024-02-01T00:00:00.000Z', updatedAt: '2024-02-01T00:00:00.000Z', deletedAt: null }, { status: 201 })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);

      const { result: queryResult } = renderHook(() => useGroupsQuery(), { wrapper });
      await waitFor(() => expect(queryResult.current.isSuccess).toBe(true));
      expect(listCallCount).toBe(1);

      const { result: mutationResult } = renderHook(() => useCreateGroupMutation(), { wrapper });
      mutationResult.current.mutate({ name: 'New Group', budgetMax: 25 });
      await waitFor(() => expect(mutationResult.current.isSuccess).toBe(true));

      await waitFor(() => expect(listCallCount).toBeGreaterThanOrEqual(2));
    });

    it('query keys contain stable prefixes for invalidation', () => {
      expect(queryKeys.groups.all).toEqual(['groups']);
      expect(queryKeys.restaurants.all).toEqual(['restaurants']);
      expect(queryKeys.sessions.all).toEqual(['sessions']);
      expect(queryKeys.calls.all).toEqual(['calls']);
      expect(queryKeys.geo.all).toEqual(['geo']);
      expect(queryKeys.auth.all).toEqual(['auth']);
      expect(queryKeys.users.all).toEqual(['users']);
    });
  });

  describe('Phase 7 mutation hooks', () => {
    it('updates restaurant and invalidates restaurant queries', async () => {
      let detailCallCount = 0;
      server.use(
        http.get(`${BASE}/restaurants/r1`, () => {
          detailCallCount++;
          return HttpResponse.json({ id: 'r1', name: 'Bistro', description: null, address: '1 Rue Paris', latitude: '48.856600', longitude: '2.352200', cuisineTags: ['French'], photoUrls: [], phone: null, website: null, createdBy: 'u1', createdAt: '2024-01-01T00:00:00.000Z' });
        }),
        http.patch(`${BASE}/restaurants/r1`, () => HttpResponse.json({ id: 'r1', name: 'Bistro Updated', description: null, address: '1 Rue Paris', latitude: '48.856600', longitude: '2.352200', cuisineTags: ['French'], photoUrls: [], phone: null, website: null, createdBy: 'u1', createdAt: '2024-01-01T00:00:00.000Z', updatedAt: '2024-01-02T00:00:00.000Z' })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);
      await qc.fetchQuery({ queryKey: queryKeys.restaurants.detail('r1'), queryFn: async () => (await fetch(`${BASE}/restaurants/r1`)).json() });
      expect(detailCallCount).toBe(1);

      const { result } = renderHook(() => useUpdateRestaurantMutation('r1'), { wrapper });
      result.current.mutate({ name: 'Bistro Updated' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => expect(detailCallCount).toBeGreaterThanOrEqual(2));
    });

    it('deletes restaurant and invalidates restaurant queries', async () => {
      let detailCallCount = 0;
      server.use(
        http.get(`${BASE}/restaurants/r1`, () => {
          detailCallCount++;
          return HttpResponse.json({ id: 'r1', name: 'Bistro', description: null, address: '1 Rue Paris', latitude: '48.856600', longitude: '2.352200', cuisineTags: ['French'], photoUrls: [], phone: null, website: null, createdBy: 'u1', createdAt: '2024-01-01T00:00:00.000Z' });
        }),
        http.delete(`${BASE}/restaurants/r1`, () => new HttpResponse(null, { status: 204 })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);
      await qc.fetchQuery({ queryKey: queryKeys.restaurants.detail('r1'), queryFn: async () => (await fetch(`${BASE}/restaurants/r1`)).json() });

      const { result } = renderHook(() => useDeleteRestaurantMutation('r1'), { wrapper });
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      await waitFor(() => expect(detailCallCount).toBeGreaterThanOrEqual(2));
    });

    it('deletes a vote and updates the vote cache', async () => {
      let votesCallCount = 0;
      server.use(
        http.get(`${BASE}/sessions/s1/votes`, () => {
          votesCallCount++;
          return HttpResponse.json(cursorPage([{ id: 'v1', sessionId: 's1', candidateId: 'c1', userId: 'u1', value: 1, createdAt: '2024-01-01T00:00:00.000Z' }]));
        }),
        http.delete(`${BASE}/sessions/s1/votes/v1`, () => new HttpResponse(null, { status: 204 })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);
      await qc.fetchQuery({ queryKey: queryKeys.sessions.votes('s1'), queryFn: async () => (await fetch(`${BASE}/sessions/s1/votes`)).json() });

      const { result } = renderHook(() => useDeleteVoteMutation('s1'), { wrapper });
      result.current.mutate('v1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const votesPage = qc.getQueryData<{ data: Array<{ id: string }> }>(queryKeys.sessions.votes('s1'));
      expect(votesCallCount).toBe(1);
      expect(votesPage?.data).toEqual([]);
    });

    it('updates group member role in the member cache', async () => {
      let membersCallCount = 0;
      server.use(
        http.get(`${BASE}/groups/g1/members`, () => {
          membersCallCount++;
          return HttpResponse.json([{ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'member', joinedAt: '2024-01-16T10:00:00.000Z' }]);
        }),
        http.patch(`${BASE}/groups/g1/members/u2/role`, () => HttpResponse.json({ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'admin', joinedAt: '2024-01-16T10:00:00.000Z' })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);
      await qc.fetchQuery({ queryKey: queryKeys.groups.members('g1'), queryFn: async () => (await fetch(`${BASE}/groups/g1/members`)).json() });

      const { result } = renderHook(() => useUpdateGroupMemberRoleMutation('g1'), { wrapper });
      result.current.mutate({ userId: 'u2', role: 'admin' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const members = qc.getQueryData<Array<{ userId: string; role: string }>>(queryKeys.groups.members('g1'));
      expect(membersCallCount).toBe(1);
      expect(members).toEqual([{ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'admin', joinedAt: '2024-01-16T10:00:00.000Z' }]);
    });

    it('removes group member from the member cache', async () => {
      let membersCallCount = 0;
      server.use(
        http.get(`${BASE}/groups/g1/members`, () => {
          membersCallCount++;
          return HttpResponse.json([{ id: 'gm2', groupId: 'g1', userId: 'u2', role: 'member', joinedAt: '2024-01-16T10:00:00.000Z' }]);
        }),
        http.delete(`${BASE}/groups/g1/members/u2`, () => new HttpResponse(null, { status: 204 })),
      );

      const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } });
      const wrapper = createWrapperWithClient(qc);
      await qc.fetchQuery({ queryKey: queryKeys.groups.members('g1'), queryFn: async () => (await fetch(`${BASE}/groups/g1/members`)).json() });

      const { result } = renderHook(() => useRemoveGroupMemberMutation('g1'), { wrapper });
      result.current.mutate('u2');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      const members = qc.getQueryData<Array<{ userId: string }>>(queryKeys.groups.members('g1'));
      expect(membersCallCount).toBe(1);
      expect(members).toEqual([]);
    });
  });
});
