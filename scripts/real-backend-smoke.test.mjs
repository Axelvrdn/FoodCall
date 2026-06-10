import { describe, expect, it } from 'vitest';

import {
  SMOKE_PATH,
  classifySmokeFailure,
  runRealBackendSmoke,
} from './real-backend-smoke.mjs';

function jsonResponse(status, body) {
  return {
    status,
    headers: { get: () => 'application/json' },
    async json() { return body; },
    async text() { return JSON.stringify(body); },
  };
}

function createFetchQueue(responses) {
  const calls = [];
  const fetchImpl = async (url, init = {}) => {
    calls.push({ url, init });
    const response = responses.shift();
    if (!response) throw new Error(`Unexpected fetch call to ${init.method ?? 'GET'} ${url}`);
    return jsonResponse(response.status, response.body);
  };
  fetchImpl.calls = calls;
  return fetchImpl;
}

describe('real backend smoke driver', () => {
  it('documents the full no-MSW happy path order', () => {
    expect(SMOKE_PATH.map((step) => step.name)).toEqual([
      'register owner',
      'login owner',
      'fetch current user',
      'create group',
      'create group invite',
      'register invitee',
      'login invitee',
      'join group with invite',
      'list group members',
      'create restaurant fixture',
      'search restaurants',
      'create vote session',
      'add session candidate',
      'list session candidates',
      'start voting',
      'cast invitee vote',
      'list invitee votes',
      'select final restaurant',
      'complete session',
      'fetch completed results',
      'create restaurant review',
      'list restaurant reviews',
    ]);
  });

  it('runs the API path with structured step output and propagated ids', async () => {
    const fetchImpl = createFetchQueue([
      { status: 201, body: { accessToken: 'owner-register-token', refreshToken: 'owner-refresh' } },
      { status: 200, body: { accessToken: 'owner-login-token', refreshToken: 'owner-refresh-2' } },
      { status: 200, body: { id: 'owner-user-id', email: 'owner@example.test' } },
      { status: 201, body: { id: 'group-id', name: 'Smoke Group' } },
      { status: 201, body: { id: 'invite-id', code: 'ABCDEFGH' } },
      { status: 201, body: { accessToken: 'invitee-register-token', refreshToken: 'invitee-refresh' } },
      { status: 200, body: { accessToken: 'invitee-login-token', refreshToken: 'invitee-refresh-2' } },
      { status: 201, body: { id: 'member-id', userId: 'invitee-user-id', groupId: 'group-id', role: 'member' } },
      { status: 200, body: [{ userId: 'owner-user-id', role: 'owner' }, { userId: 'invitee-user-id', role: 'member' }] },
      { status: 201, body: { id: 'restaurant-id', name: 'Smoke Bistro' } },
      { status: 200, body: { data: [{ id: 'restaurant-id', name: 'Smoke Bistro' }], meta: { nextCursor: null } } },
      { status: 201, body: { id: 'session-id', status: 'draft' } },
      { status: 201, body: { id: 'candidate-id', restaurantId: 'restaurant-id', sessionId: 'session-id' } },
      { status: 200, body: [{ id: 'candidate-id', restaurantId: 'restaurant-id', sessionId: 'session-id' }] },
      { status: 201, body: { id: 'session-id', status: 'voting' } },
      { status: 201, body: { id: 'vote-id', candidateId: 'candidate-id', sessionId: 'session-id' } },
      { status: 200, body: { data: [{ id: 'vote-id', candidateId: 'candidate-id' }], meta: { nextCursor: null } } },
      { status: 201, body: { id: 'session-id', selectedRestaurantId: 'restaurant-id', status: 'voting' } },
      { status: 201, body: { id: 'session-id', selectedRestaurantId: 'restaurant-id', status: 'completed' } },
      { status: 200, body: [{ candidateId: 'candidate-id', restaurantId: 'restaurant-id', restaurantName: 'Smoke Bistro', votes: 1, creatorApproved: false }] },
      { status: 201, body: { id: 'review-id', restaurantId: 'restaurant-id', sessionId: 'session-id', rating: 5 } },
      { status: 200, body: { data: [{ id: 'review-id', restaurantId: 'restaurant-id', rating: 5 }], meta: { nextCursor: null } } },
    ]);

    const result = await runRealBackendSmoke({
      apiBase: 'http://api.example.test/api',
      fetchImpl,
      runId: 'unit',
    });

    expect(result.ok).toBe(true);
    expect(result.summary).toMatchObject({ total: 22, passed: 22, failed: 0 });
    expect(result.context).toMatchObject({
      ownerUserId: 'owner-user-id',
      groupId: 'group-id',
      inviteCode: 'ABCDEFGH',
      inviteeUserId: 'invitee-user-id',
      restaurantId: 'restaurant-id',
      sessionId: 'session-id',
      candidateId: 'candidate-id',
      voteId: 'vote-id',
      reviewId: 'review-id',
    });
    expect(result.steps.every((step) => step.ok)).toBe(true);
    expect(fetchImpl.calls.at(7).init.headers.Authorization).toBe('Bearer invitee-login-token');
    expect(JSON.parse(fetchImpl.calls.at(17).init.body)).toEqual({ restaurantId: 'restaurant-id' });
  });

  it('classifies route-level failures as contract failures', async () => {
    const fetchImpl = createFetchQueue([
      { status: 201, body: { accessToken: 'owner-register-token', refreshToken: 'owner-refresh' } },
      { status: 200, body: { accessToken: 'owner-login-token', refreshToken: 'owner-refresh-2' } },
      { status: 200, body: { id: 'owner-user-id', email: 'owner@example.test' } },
      { status: 201, body: { id: 'group-id', name: 'Smoke Group' } },
      { status: 201, body: { id: 'invite-id', code: 'ABCDEFGH' } },
      { status: 201, body: { accessToken: 'invitee-register-token', refreshToken: 'invitee-refresh' } },
      { status: 200, body: { accessToken: 'invitee-login-token', refreshToken: 'invitee-refresh-2' } },
      { status: 201, body: { id: 'member-id', userId: 'invitee-user-id', groupId: 'group-id', role: 'member' } },
      { status: 200, body: [{ userId: 'owner-user-id', role: 'owner' }, { userId: 'invitee-user-id', role: 'member' }] },
      { status: 201, body: { id: 'restaurant-id', name: 'Smoke Bistro' } },
      { status: 200, body: { data: [{ id: 'restaurant-id', name: 'Smoke Bistro' }], meta: { nextCursor: null } } },
      { status: 201, body: { id: 'session-id', status: 'draft' } },
      { status: 201, body: { id: 'candidate-id', restaurantId: 'restaurant-id', sessionId: 'session-id' } },
      { status: 404, body: { statusCode: 404, message: 'Cannot GET /api/sessions/session-id/candidates', error: 'Not Found' } },
    ]);

    const result = await runRealBackendSmoke({
      apiBase: 'http://api.example.test/api',
      fetchImpl,
      runId: 'unit',
    });

    expect(result.ok).toBe(false);
    expect(result.summary).toMatchObject({ total: 22, passed: 13, failed: 1, skipped: 8 });
    expect(result.failure).toMatchObject({
      name: 'list session candidates',
      classification: 'contract-failure',
      status: 404,
    });
  });

  it('separates data/setup failures from route contract failures', () => {
    expect(classifySmokeFailure({ status: 404, expectStatus: [200] })).toBe('contract-failure');
    expect(classifySmokeFailure({ status: 500, expectStatus: [200] })).toBe('backend-runtime-failure');
    expect(classifySmokeFailure({ status: 409, expectStatus: [201] })).toBe('data-setup-failure');
    expect(classifySmokeFailure({ status: 401, expectStatus: [200] })).toBe('auth-setup-failure');
  });
});
