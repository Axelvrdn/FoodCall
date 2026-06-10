#!/usr/bin/env node

const DEFAULT_API_BASE = process.env.FOODCALL_API_BASE ?? 'http://localhost:3000/api';
const DEFAULT_PASSWORD = 'SmokePass123!';

export const SMOKE_PATH = [
  { name: 'register owner', method: 'POST', path: '/auth/register', expectStatus: [201] },
  { name: 'login owner', method: 'POST', path: '/auth/login', expectStatus: [200, 201] },
  { name: 'fetch current user', method: 'GET', path: '/users/me', expectStatus: [200] },
  { name: 'create group', method: 'POST', path: '/groups', expectStatus: [201] },
  { name: 'create group invite', method: 'POST', path: '/groups/:groupId/invites', expectStatus: [201] },
  { name: 'register invitee', method: 'POST', path: '/auth/register', expectStatus: [201] },
  { name: 'login invitee', method: 'POST', path: '/auth/login', expectStatus: [200, 201] },
  { name: 'join group with invite', method: 'POST', path: '/groups/join', expectStatus: [201] },
  { name: 'list group members', method: 'GET', path: '/groups/:groupId/members', expectStatus: [200] },
  { name: 'create restaurant fixture', method: 'POST', path: '/restaurants', expectStatus: [201] },
  { name: 'search restaurants', method: 'GET', path: '/restaurants/search', expectStatus: [200] },
  { name: 'create vote session', method: 'POST', path: '/groups/:groupId/sessions', expectStatus: [201] },
  { name: 'add session candidate', method: 'POST', path: '/sessions/:sessionId/candidates', expectStatus: [201] },
  { name: 'list session candidates', method: 'GET', path: '/sessions/:sessionId/candidates', expectStatus: [200] },
  { name: 'start voting', method: 'POST', path: '/sessions/:sessionId/start-voting', expectStatus: [200, 201] },
  { name: 'cast invitee vote', method: 'POST', path: '/sessions/:sessionId/votes', expectStatus: [201] },
  { name: 'list invitee votes', method: 'GET', path: '/sessions/:sessionId/votes', expectStatus: [200] },
  { name: 'select final restaurant', method: 'POST', path: '/sessions/:sessionId/select-restaurant', expectStatus: [200, 201] },
  { name: 'complete session', method: 'POST', path: '/sessions/:sessionId/complete', expectStatus: [200, 201] },
  { name: 'fetch completed results', method: 'GET', path: '/sessions/:sessionId/results', expectStatus: [200] },
  { name: 'create restaurant review', method: 'POST', path: '/restaurants/:restaurantId/reviews', expectStatus: [201] },
  { name: 'list restaurant reviews', method: 'GET', path: '/restaurants/:restaurantId/reviews', expectStatus: [200] },
];

export function classifySmokeFailure({ status, expectStatus }) {
  if (status === 0) return 'environment-failure';
  if (status === 401 || status === 403) return 'auth-setup-failure';
  if (status === 404 || status === 405) return 'contract-failure';
  if (status === 409 || status === 422) return 'data-setup-failure';
  if (status >= 500) return 'backend-runtime-failure';
  if (!expectStatus.includes(status)) return 'contract-failure';
  return 'unknown-failure';
}

export async function runRealBackendSmoke(options = {}) {
  const apiBase = stripTrailingSlash(options.apiBase ?? DEFAULT_API_BASE);
  const fetchImpl = options.fetchImpl ?? globalThis.fetch;
  if (!fetchImpl) throw new Error('A fetch implementation is required. Use Node 18+ or pass fetchImpl.');

  const runId = options.runId ?? new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const context = createInitialContext(runId);
  const steps = [];
  let failure = null;

  for (const step of SMOKE_PATH) {
    if (failure) {
      steps.push({ name: step.name, method: step.method, path: resolvePath(step.path, context), ok: false, skipped: true });
      continue;
    }

    const startedAt = Date.now();
    const request = buildRequest(step, context);
    try {
      const response = await fetchImpl(`${apiBase}${request.path}`, request.init);
      const body = await readResponseBody(response);
      const ok = step.expectStatus.includes(response.status) && validateStepResponse(step.name, body, context);
      const record = {
        name: step.name,
        method: step.method,
        path: request.path,
        expectedStatus: step.expectStatus,
        status: response.status,
        ok,
        durationMs: Date.now() - startedAt,
        response: summarizeBody(body),
      };

      if (ok) {
        applyStepResponse(step.name, body, context);
      } else {
        record.classification = classifySmokeFailure({ status: response.status, expectStatus: step.expectStatus });
        record.message = response.status === 200 || response.status === 201
          ? `Response shape did not satisfy ${step.name}`
          : extractErrorMessage(body);
        failure = record;
      }
      steps.push(record);
    } catch (error) {
      const record = {
        name: step.name,
        method: step.method,
        path: request.path,
        expectedStatus: step.expectStatus,
        status: 0,
        ok: false,
        durationMs: Date.now() - startedAt,
        classification: 'environment-failure',
        message: error instanceof Error ? error.message : String(error),
      };
      failure = record;
      steps.push(record);
    }
  }

  const passed = steps.filter((step) => step.ok).length;
  const skipped = steps.filter((step) => step.skipped).length;
  const failed = steps.filter((step) => !step.ok && !step.skipped).length;
  return {
    ok: failed === 0,
    apiBase,
    mswEnabled: false,
    runId,
    summary: { total: SMOKE_PATH.length, passed, failed, skipped },
    failure,
    context: publicContext(context),
    steps,
  };
}

function createInitialContext(runId) {
  const suffix = runId.toLowerCase();
  return {
    runId,
    password: DEFAULT_PASSWORD,
    ownerEmail: `owner-${suffix}@smoke.foodcall.test`,
    ownerDisplayName: `Smoke Owner ${suffix}`,
    inviteeEmail: `invitee-${suffix}@smoke.foodcall.test`,
    inviteeDisplayName: `Smoke Invitee ${suffix}`,
    groupName: `Smoke Group ${suffix}`,
    restaurantName: `Smoke Bistro ${suffix}`,
  };
}

function buildRequest(step, context) {
  const path = addQuery(resolvePath(step.path, context), queryForStep(step.name, context));
  const body = bodyForStep(step.name, context);
  const headers = { Accept: 'application/json' };
  const token = tokenForStep(step.name, context);
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return {
    path,
    init: {
      method: step.method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    },
  };
}

function bodyForStep(name, context) {
  switch (name) {
    case 'register owner':
      return { email: context.ownerEmail, password: context.password, displayName: context.ownerDisplayName };
    case 'login owner':
      return { email: context.ownerEmail, password: context.password };
    case 'create group':
      return {
        name: context.groupName,
        description: 'Phase 8 no-MSW smoke group',
        budgetMax: 25,
        defaultStartAddress: '1 Rue de la Paix, Paris',
        defaultStartLatitude: 48.8566,
        defaultStartLongitude: 2.3522,
        defaultSearchRadiusMeters: 1500,
      };
    case 'register invitee':
      return { email: context.inviteeEmail, password: context.password, displayName: context.inviteeDisplayName };
    case 'login invitee':
      return { email: context.inviteeEmail, password: context.password };
    case 'join group with invite':
      return { code: context.inviteCode };
    case 'create restaurant fixture':
      return {
        name: context.restaurantName,
        description: 'Phase 8 smoke restaurant fixture',
        address: `8 Smoke Street ${context.runId}, Paris`,
        latitude: 48.857,
        longitude: 2.353,
        estimatedCostPerPerson: 18,
        cuisineTags: ['smoke', 'phase-8'],
        photoUrls: [],
      };
    case 'create vote session':
      return {
        name: `Smoke Session ${context.runId}`,
        description: 'Phase 8 no-MSW smoke session',
        startAddress: '1 Rue de la Paix, Paris',
        startLatitude: 48.8566,
        startLongitude: 2.3522,
        searchRadiusMeters: 1500,
        budgetMax: 25,
      };
    case 'add session candidate':
      return { restaurantId: context.restaurantId };
    case 'cast invitee vote':
      return { candidateId: context.candidateId };
    case 'select final restaurant':
      return { restaurantId: context.restaurantId };
    case 'create restaurant review':
      return { sessionId: context.sessionId, rating: 5, comment: `Phase 8 smoke review ${context.runId}` };
    default:
      return undefined;
  }
}

function queryForStep(name, context) {
  switch (name) {
    case 'search restaurants':
      return { q: context.restaurantName, limit: 5 };
    case 'list invitee votes':
    case 'list restaurant reviews':
      return { limit: 5 };
    default:
      return undefined;
  }
}

function tokenForStep(name, context) {
  if (['register owner', 'login owner', 'register invitee', 'login invitee'].includes(name)) return null;
  if (['join group with invite', 'cast invitee vote', 'list invitee votes'].includes(name)) return context.inviteeAccessToken;
  return context.ownerAccessToken;
}

function validateStepResponse(name, body, context) {
  switch (name) {
    case 'register owner':
    case 'login owner':
    case 'register invitee':
    case 'login invitee':
      return hasString(body, 'accessToken');
    case 'fetch current user':
      return hasString(body, 'id');
    case 'create group':
      return hasString(body, 'id');
    case 'create group invite':
      return typeof body?.code === 'string' && body.code.length === 8;
    case 'join group with invite':
      return body?.groupId === context.groupId || hasString(body, 'groupId');
    case 'list group members':
      return Array.isArray(body) && body.some((member) => member.userId === context.ownerUserId) && body.some((member) => member.userId === context.inviteeUserId);
    case 'create restaurant fixture':
      return hasString(body, 'id');
    case 'search restaurants':
      return Array.isArray(body?.data) && body.data.some((restaurant) => restaurant.id === context.restaurantId);
    case 'create vote session':
      return hasString(body, 'id');
    case 'add session candidate':
      return hasString(body, 'id') && body.restaurantId === context.restaurantId;
    case 'list session candidates':
      return Array.isArray(body) && body.some((candidate) => candidate.id === context.candidateId || candidate.restaurantId === context.restaurantId);
    case 'start voting':
      return body?.status === 'voting';
    case 'cast invitee vote':
      return hasString(body, 'id') && body.candidateId === context.candidateId;
    case 'list invitee votes':
      return Array.isArray(body?.data) && body.data.some((vote) => vote.id === context.voteId || vote.candidateId === context.candidateId);
    case 'select final restaurant':
      return body?.selectedRestaurantId === context.restaurantId;
    case 'complete session':
      return body?.status === 'completed' && body?.selectedRestaurantId === context.restaurantId;
    case 'fetch completed results':
      return Array.isArray(body) && body.some((result) => result.restaurantId === context.restaurantId && Number(result.votes) >= 1);
    case 'create restaurant review':
      return hasString(body, 'id') && body.restaurantId === context.restaurantId;
    case 'list restaurant reviews':
      return Array.isArray(body?.data) && body.data.some((review) => review.id === context.reviewId || review.restaurantId === context.restaurantId);
    default:
      return true;
  }
}

function applyStepResponse(name, body, context) {
  switch (name) {
    case 'register owner':
      context.ownerRegisterAccessToken = body.accessToken;
      break;
    case 'login owner':
      context.ownerAccessToken = body.accessToken;
      break;
    case 'fetch current user':
      context.ownerUserId = body.id;
      break;
    case 'create group':
      context.groupId = body.id;
      break;
    case 'create group invite':
      context.inviteCode = body.code;
      break;
    case 'register invitee':
      context.inviteeRegisterAccessToken = body.accessToken;
      break;
    case 'login invitee':
      context.inviteeAccessToken = body.accessToken;
      break;
    case 'join group with invite':
      context.inviteeUserId = body.userId;
      break;
    case 'create restaurant fixture':
      context.restaurantId = body.id;
      break;
    case 'create vote session':
      context.sessionId = body.id;
      break;
    case 'add session candidate':
      context.candidateId = body.id;
      break;
    case 'cast invitee vote':
      context.voteId = body.id;
      break;
    case 'create restaurant review':
      context.reviewId = body.id;
      break;
  }
}

async function readResponseBody(response) {
  const contentType = response.headers?.get?.('content-type') ?? '';
  if (contentType.includes('application/json')) return response.json();
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function resolvePath(template, context) {
  return template
    .replace(':groupId', encodeURIComponent(context.groupId ?? ''))
    .replace(':sessionId', encodeURIComponent(context.sessionId ?? ''))
    .replace(':restaurantId', encodeURIComponent(context.restaurantId ?? ''));
}

function addQuery(path, query) {
  if (!query) return path;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const serialized = params.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function stripTrailingSlash(value) {
  return value.endsWith('/') ? value.slice(0, -1) : value;
}

function hasString(value, key) {
  return typeof value?.[key] === 'string' && value[key].length > 0;
}

function summarizeBody(body) {
  if (body == null || typeof body === 'string') return body;
  if (Array.isArray(body)) return { type: 'array', length: body.length, sample: body[0] ?? null };
  const summary = {};
  for (const key of ['id', 'status', 'code', 'message', 'error', 'groupId', 'restaurantId', 'sessionId', 'candidateId', 'selectedRestaurantId']) {
    if (body[key] !== undefined) summary[key] = body[key];
  }
  if (Array.isArray(body.data)) summary.data = { length: body.data.length, sample: body.data[0] ?? null };
  return Object.keys(summary).length ? summary : { keys: Object.keys(body) };
}

function extractErrorMessage(body) {
  if (typeof body === 'string') return body;
  if (Array.isArray(body?.message)) return body.message.join(', ');
  return body?.message ?? body?.error ?? 'Unexpected smoke response';
}

function publicContext(context) {
  return {
    ownerEmail: context.ownerEmail,
    inviteeEmail: context.inviteeEmail,
    ownerUserId: context.ownerUserId,
    inviteeUserId: context.inviteeUserId,
    groupId: context.groupId,
    inviteCode: context.inviteCode,
    restaurantId: context.restaurantId,
    sessionId: context.sessionId,
    candidateId: context.candidateId,
    voteId: context.voteId,
    reviewId: context.reviewId,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runRealBackendSmoke({ apiBase: process.env.FOODCALL_API_BASE ?? DEFAULT_API_BASE })
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
      process.exitCode = result.ok ? 0 : 1;
    })
    .catch((error) => {
      console.error(JSON.stringify({ ok: false, classification: 'environment-failure', message: error.message }, null, 2));
      process.exitCode = 1;
    });
}
