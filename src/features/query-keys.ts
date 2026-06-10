export const queryKeys = {
  auth: {
    all: ['auth'] as const,
    me: ['auth', 'me'] as const,
  },
  users: {
    all: ['users'] as const,
    me: ['users', 'me'] as const,
  },
  groups: {
    all: ['groups'] as const,
    list: (cursor?: string) => ['groups', 'list', cursor ?? null] as const,
    detail: (id: string) => ['groups', 'detail', id] as const,
    members: (groupId: string) => ['groups', 'detail', groupId, 'members'] as const,
    invites: (groupId: string) => ['groups', 'detail', groupId, 'invites'] as const,
    sessions: (groupId: string, cursor?: string) => ['groups', 'detail', groupId, 'sessions', cursor ?? null] as const,
    recommendations: (groupId: string) => ['groups', 'detail', groupId, 'recommendations'] as const,
  },
  restaurants: {
    all: ['restaurants'] as const,
    list: (cursor?: string) => ['restaurants', 'list', cursor ?? null] as const,
    nearby: (params: { lat: number; lng: number; radius?: number; limit?: number; cursor?: string }) =>
      ['restaurants', 'nearby', params] as const,
    search: (q?: string, cursor?: string, limit?: number) => ['restaurants', 'search', q ?? null, cursor ?? null, limit ?? null] as const,
    detail: (id: string) => ['restaurants', 'detail', id] as const,
    reviews: (restaurantId: string, cursor?: string) => ['restaurants', 'detail', restaurantId, 'reviews', cursor ?? null] as const,
  },
  externalRestaurants: {
    all: ['external-restaurants'] as const,
    search: (params: { lat: number; lng: number; radius?: number; q?: string; limit?: number; cursor?: string; includeRoute?: boolean; strictRoute?: boolean }) =>
      ['external-restaurants', 'search', params] as const,
  },
  sessions: {
    all: ['sessions'] as const,
    detail: (id: string) => ['sessions', 'detail', id] as const,
    candidates: (sessionId: string) => ['sessions', 'detail', sessionId, 'candidates'] as const,
    votes: (sessionId: string, cursor?: string) => ['sessions', 'detail', sessionId, 'votes', cursor ?? null] as const,
    results: (sessionId: string) => ['sessions', 'detail', sessionId, 'results'] as const,
    calls: (sessionId: string, cursor?: string) => ['sessions', 'detail', sessionId, 'calls', cursor ?? null] as const,
    recommendations: (sessionId: string) => ['sessions', 'detail', sessionId, 'recommendations'] as const,
  },
  calls: {
    all: ['calls'] as const,
    detail: (id: string) => ['calls', 'detail', id] as const,
    feedback: (callId: string) => ['calls', 'detail', callId, 'feedback'] as const,
  },
  geo: {
    all: ['geo'] as const,
    geocode: (q: string) => ['geo', 'geocode', q] as const,
    route: (params: { fromLat: number; fromLng: number; toLat: number; toLng: number }) => ['geo', 'route', params] as const,
  },
} as const;
