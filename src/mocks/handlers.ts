import { http, HttpResponse } from 'msw';
import { calculateDistanceMeters, getRestaurantCoordinates, env } from '@/lib';
import {
  apiErrors,
  callFixtures,
  candidateFixtures,
  defaultUser,
  emptyPage,
  externalRestaurantFixtures,
  feedbackFixtures,
  geocodeFixture,
  groupFixtures,
  importResponseFixture,
  inviteFixtures,
  memberFixtures,
  paginate,
  recommendationFixtures,
  restaurantFixtures,
  reviewFixtures,
  routeFixture,
  sessionFixtures,
  userFixtures,
  voteFixtures,
  voteResultFixtures,
} from './fixtures';
import type { FoodCall, Group, GroupCreateRequest, GroupInvite, GroupListItem, GroupMember, GroupUpdateRequest, Restaurant, RestaurantReview, RestaurantUpdateRequest, SessionCandidate, User, Vote, VoteSession } from '@/types/api';

const api = (path: string) => `${env.apiUrl}${path}`;

let mockVotes: Vote[] = [...voteFixtures];
let mockGroups: Group[] = [...groupFixtures];
let mockGroupMembers: GroupMember[] = [...memberFixtures];
let mockGroupInvites: GroupInvite[] = [...inviteFixtures];
let mockRestaurants: Restaurant[] = [...restaurantFixtures];
let mockCurrentUser: User = { ...defaultUser };
let nextVoteIndex = 1;
const mockVotesStorageKey = 'foodcall.msw.votes';
const mockGroupsStorageKey = 'foodcall.msw.groups';
const mockGroupMembersStorageKey = 'foodcall.msw.group-members';
const mockGroupInvitesStorageKey = 'foodcall.msw.group-invites';
const mockRestaurantsStorageKey = 'foodcall.msw.restaurants';
const mockCurrentUserStorageKey = 'foodcall.msw.current-user';

function getBrowserStorage(): Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null {
  if (typeof window === 'undefined') return null;

  try {
    const storage = window.localStorage;
    if (
      !storage ||
      typeof storage.getItem !== 'function' ||
      typeof storage.setItem !== 'function' ||
      typeof storage.removeItem !== 'function'
    ) {
      return null;
    }
    return storage;
  } catch {
    return null;
  }
}

function readMockVotes(): Vote[] {
  const storage = getBrowserStorage();
  if (!storage) return mockVotes;
  const rawVotes = storage.getItem(mockVotesStorageKey);
  if (!rawVotes) {
    storage.setItem(mockVotesStorageKey, JSON.stringify(mockVotes));
    return mockVotes;
  }
  try {
    const parsedVotes = JSON.parse(rawVotes) as Vote[];
    mockVotes = parsedVotes;
    return parsedVotes;
  } catch {
    storage.setItem(mockVotesStorageKey, JSON.stringify(mockVotes));
    return mockVotes;
  }
}

function writeMockVotes(votes: Vote[]) {
  mockVotes = votes;
  getBrowserStorage()?.setItem(mockVotesStorageKey, JSON.stringify(votes));
}

function readMockGroups(): Group[] {
  const storage = getBrowserStorage();
  if (!storage) return mockGroups;
  const rawGroups = storage.getItem(mockGroupsStorageKey);
  if (!rawGroups) {
    storage.setItem(mockGroupsStorageKey, JSON.stringify(mockGroups));
    return mockGroups;
  }
  try {
    const parsedGroups = JSON.parse(rawGroups) as Group[];
    mockGroups = parsedGroups;
    return parsedGroups;
  } catch {
    storage.setItem(mockGroupsStorageKey, JSON.stringify(mockGroups));
    return mockGroups;
  }
}

function writeMockGroups(groups: Group[]) {
  mockGroups = groups;
  getBrowserStorage()?.setItem(mockGroupsStorageKey, JSON.stringify(groups));
}

function readMockGroupMembers(): GroupMember[] {
  const storage = getBrowserStorage();
  if (!storage) return mockGroupMembers;
  const rawMembers = storage.getItem(mockGroupMembersStorageKey);
  if (!rawMembers) {
    storage.setItem(mockGroupMembersStorageKey, JSON.stringify(mockGroupMembers));
    return mockGroupMembers;
  }
  try {
    const parsedMembers = JSON.parse(rawMembers) as GroupMember[];
    mockGroupMembers = parsedMembers;
    return parsedMembers;
  } catch {
    storage.setItem(mockGroupMembersStorageKey, JSON.stringify(mockGroupMembers));
    return mockGroupMembers;
  }
}

function writeMockGroupMembers(members: GroupMember[]) {
  mockGroupMembers = members;
  getBrowserStorage()?.setItem(mockGroupMembersStorageKey, JSON.stringify(members));
}

function readMockGroupInvites(): GroupInvite[] {
  const storage = getBrowserStorage();
  if (!storage) return mockGroupInvites;
  const rawInvites = storage.getItem(mockGroupInvitesStorageKey);
  if (!rawInvites) {
    storage.setItem(mockGroupInvitesStorageKey, JSON.stringify(mockGroupInvites));
    return mockGroupInvites;
  }
  try {
    const parsedInvites = JSON.parse(rawInvites) as GroupInvite[];
    mockGroupInvites = parsedInvites;
    return parsedInvites;
  } catch {
    storage.setItem(mockGroupInvitesStorageKey, JSON.stringify(mockGroupInvites));
    return mockGroupInvites;
  }
}

function writeMockGroupInvites(invites: GroupInvite[]) {
  mockGroupInvites = invites;
  getBrowserStorage()?.setItem(mockGroupInvitesStorageKey, JSON.stringify(invites));
}

function readMockRestaurants(): Restaurant[] {
  const storage = getBrowserStorage();
  if (!storage) return mockRestaurants;
  const rawRestaurants = storage.getItem(mockRestaurantsStorageKey);
  if (!rawRestaurants) {
    storage.setItem(mockRestaurantsStorageKey, JSON.stringify(mockRestaurants));
    return mockRestaurants;
  }
  try {
    const parsedRestaurants = JSON.parse(rawRestaurants) as Restaurant[];
    mockRestaurants = parsedRestaurants;
    return parsedRestaurants;
  } catch {
    storage.setItem(mockRestaurantsStorageKey, JSON.stringify(mockRestaurants));
    return mockRestaurants;
  }
}

function writeMockRestaurants(restaurants: Restaurant[]) {
  mockRestaurants = restaurants;
  getBrowserStorage()?.setItem(mockRestaurantsStorageKey, JSON.stringify(restaurants));
}

function readMockCurrentUser(): User {
  const storage = getBrowserStorage();
  if (!storage) return mockCurrentUser;
  const rawUser = storage.getItem(mockCurrentUserStorageKey);
  if (!rawUser) {
    storage.setItem(mockCurrentUserStorageKey, JSON.stringify(mockCurrentUser));
    return mockCurrentUser;
  }
  try {
    const parsedUser = JSON.parse(rawUser) as User;
    mockCurrentUser = parsedUser;
    return parsedUser;
  } catch {
    storage.setItem(mockCurrentUserStorageKey, JSON.stringify(mockCurrentUser));
    return mockCurrentUser;
  }
}

function writeMockCurrentUser(user: User) {
  mockCurrentUser = user;
  getBrowserStorage()?.setItem(mockCurrentUserStorageKey, JSON.stringify(user));
}

function textMatchesRestaurant(restaurant: Restaurant, query: string) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;

  return (
    restaurant.name.toLowerCase().includes(normalizedQuery) ||
    restaurant.address.toLowerCase().includes(normalizedQuery) ||
    restaurant.cuisineTags.some((tag) => tag.toLowerCase().includes(normalizedQuery))
  );
}

function withDistanceFromOrigin(restaurant: Restaurant, origin: { lat: number; lng: number }): Restaurant | null {
  const coordinates = getRestaurantCoordinates(restaurant);
  if (!coordinates) return null;

  return {
    ...restaurant,
    distanceMeters: calculateDistanceMeters(origin, coordinates),
  };
}

function withoutDistance(restaurant: Restaurant): Restaurant {
  const { distanceMeters, ...rest } = restaurant;
  void distanceMeters;
  return rest;
}

export function resetMockState() {
  mockVotes = [...voteFixtures];
  mockGroups = [...groupFixtures];
  mockGroupMembers = [...memberFixtures];
  mockGroupInvites = [...inviteFixtures];
  mockRestaurants = [...restaurantFixtures];
  mockCurrentUser = { ...defaultUser };
  nextVoteIndex = 1;
  const storage = getBrowserStorage();
  storage?.removeItem(mockVotesStorageKey);
  storage?.removeItem(mockGroupsStorageKey);
  storage?.removeItem(mockGroupMembersStorageKey);
  storage?.removeItem(mockGroupInvitesStorageKey);
  storage?.removeItem(mockRestaurantsStorageKey);
  storage?.removeItem(mockCurrentUserStorageKey);
}

type Scenario = 'empty' | 'validation' | 'auth' | 'permission' | 'conflict' | 'rate-limit' | 'provider-failure' | 'provider-failure-502' | 'provider-failure-504' | 'not-found';

function getScenario(url: URL): Scenario | null {
  return (url.searchParams.get('scenario') || null) as Scenario | null;
}

function groupToListItem(group: Group, role: GroupMember['role']): GroupListItem {
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    role,
    budgetMax: group.budgetMax,
    createdAt: group.createdAt,
  };
}

// ── Auth ─────────────────────────────────────────────────────────────────
const authHandlers = [
  http.post(api('/auth/login'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ fields: ['email', 'password'] }), { status: 400 });
    const body = await request.json() as { email?: string; password?: string };
    const user = userFixtures.find(u => u.email === body?.email);
    if (!user) return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    return HttpResponse.json({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' });
  }),

  http.post(api('/auth/register'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Email already registered'), { status: 409 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ email: 'Invalid email', password: 'Password too weak' }), { status: 400 });
    return HttpResponse.json({ accessToken: 'mock-access-token', refreshToken: 'mock-refresh-token' }, { status: 201 });
  }),

  http.post(api('/auth/refresh'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'rate-limit') return HttpResponse.json(apiErrors.rateLimit(), { status: 429 });
    return HttpResponse.json({ accessToken: 'mock-access-token-refreshed', refreshToken: 'mock-refresh-token-refreshed' });
  }),

  http.post(api('/auth/logout'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    const body = await request.json() as { refreshToken?: string };
    if (!body?.refreshToken) return HttpResponse.json(apiErrors.validation({ refreshToken: 'Refresh token required' }), { status: 400 });
    return new HttpResponse(null, { status: 204 });
  }),

  http.post(api('/auth/change-password'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ currentPassword: 'Incorrect password' }), { status: 400 });
    return HttpResponse.json({ message: 'Password changed successfully' });
  }),
];

// ── Users ────────────────────────────────────────────────────────────────
const userHandlers = [
  http.get(api('/users/me'), ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    return HttpResponse.json(readMockCurrentUser());
  }),

  http.patch(api('/users/me'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    const updatedUser = { ...readMockCurrentUser(), ...body, updatedAt: new Date().toISOString() };
    writeMockCurrentUser(updatedUser);
    return HttpResponse.json(updatedUser);
  }),

  http.post(api('/users/me/avatar'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ base64: 'File too large' }), { status: 400 });
    const body = await request.json() as { filename?: string; contentType?: string; base64?: string };
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!body.contentType || !allowedTypes.includes(body.contentType)) {
      return HttpResponse.json(apiErrors.validation({ contentType: 'Formats acceptés : JPEG, PNG ou WebP.' }), { status: 400 });
    }
    const updatedUser = { ...readMockCurrentUser(), avatarUrl: 'https://example.com/avatars/new.png', updatedAt: new Date().toISOString() };
    writeMockCurrentUser(updatedUser);
    return HttpResponse.json(updatedUser, { status: 201 });
  }),

  http.delete(api('/users/me/avatar'), () => {
    const updatedUser = { ...readMockCurrentUser(), avatarUrl: null, updatedAt: new Date().toISOString() };
    writeMockCurrentUser(updatedUser);
    return HttpResponse.json(updatedUser);
  }),
];

// ── Groups ──────────────────────────────────────────────────────────────
const groupHandlers = [
  http.get(api('/groups'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'empty') return HttpResponse.json(emptyPage<GroupListItem>());
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const currentUser = readMockCurrentUser();
    const groups = readMockGroups();
    const memberships = readMockGroupMembers().filter(member => member.userId === currentUser.id);
    const visibleGroups = memberships
      .map((membership) => {
        const group = groups.find(item => item.id === membership.groupId && !item.deletedAt);
        return group ? groupToListItem(group, membership.role) : null;
      })
      .filter((group): group is GroupListItem => group != null);
    return HttpResponse.json(paginate(visibleGroups, cursor, limit));
  }),

  http.get(api('/groups/:id'), ({ params }) => {
    const group = readMockGroups().find(g => g.id === params['id']);
    if (!group) return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    return HttpResponse.json(group);
  }),

  http.post(api('/groups'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ name: 'Name is required' }), { status: 400 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Group name already exists'), { status: 409 });
    const body = await request.json() as GroupCreateRequest;
    const newGroup: Group = {
      id: 'group-new', name: body.name, description: body.description ?? null,
      createdBy: defaultUser.id, budgetMax: body.budgetMax != null ? String(body.budgetMax) : null,
      defaultStartAddress: body.defaultStartAddress ?? null, defaultStartLatitude: body.defaultStartLatitude != null ? String(body.defaultStartLatitude) : null,
      defaultStartLongitude: body.defaultStartLongitude != null ? String(body.defaultStartLongitude) : null,
      defaultSearchRadiusMeters: body.defaultSearchRadiusMeters ?? null,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), deletedAt: null,
    };
    writeMockGroups([...readMockGroups(), newGroup]);
    writeMockGroupMembers([...readMockGroupMembers(), {
      id: `mem-${newGroup.id}-${defaultUser.id}`,
      groupId: newGroup.id,
      userId: defaultUser.id,
      role: 'owner',
      joinedAt: newGroup.createdAt,
      user: defaultUser,
    }]);
    return HttpResponse.json(newGroup, { status: 201 });
  }),

  http.patch(api('/groups/:id'), async ({ params, request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Only owner or admin can update'), { status: 403 });
    const groups = readMockGroups();
    const group = groups.find(g => g.id === params['id']);
    if (!group) return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    const body = await request.json() as GroupUpdateRequest;
    const updatedGroup: Group = {
      ...group,
      ...body,
      budgetMax: body.budgetMax != null ? String(body.budgetMax) : group.budgetMax,
      defaultStartLatitude: body.defaultStartLatitude != null ? String(body.defaultStartLatitude) : group.defaultStartLatitude,
      defaultStartLongitude: body.defaultStartLongitude != null ? String(body.defaultStartLongitude) : group.defaultStartLongitude,
      updatedAt: new Date().toISOString(),
    };
    writeMockGroups(groups.map(item => item.id === updatedGroup.id ? updatedGroup : item));
    return HttpResponse.json(updatedGroup);
  }),

  http.delete(api('/groups/:id'), ({ params }) => {
    const group = groupFixtures.find(g => g.id === params['id']);
    if (!group) return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),

  // Members
  http.get(api('/groups/:id/members'), ({ params }) => {
    const members = readMockGroupMembers().filter(m => m.groupId === params['id']);
    return HttpResponse.json(members);
  }),

  http.patch(api('/groups/:id/members/:userId/role'), async ({ params, request }) => {
    const body = await request.json() as { role: string };
    const members = readMockGroupMembers();
    const member = members.find(m => m.groupId === params['id'] && m.userId === params['userId']);
    if (!member) return HttpResponse.json(apiErrors.notFound('Member'), { status: 404 });
    const updatedMember = { ...member, role: body.role as GroupMember['role'] };
    writeMockGroupMembers(members.map(item => item.id === updatedMember.id ? updatedMember : item));
    return HttpResponse.json(updatedMember);
  }),

  http.delete(api('/groups/:id/members/:userId'), ({ params }) => {
    writeMockGroupMembers(readMockGroupMembers().filter(member => !(member.groupId === params['id'] && member.userId === params['userId'])));
    return new HttpResponse(null, { status: 204 });
  }),

  // Invites
  http.post(api('/groups/:id/invites'), ({ params, request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Only owner or admin can create invites'), { status: 403 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ maxUses: 'Must be positive' }), { status: 400 });
    if (scenario === 'not-found') return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Invite limit reached'), { status: 409 });
    const group = readMockGroups().find(item => item.id === params['id']);
    if (!group) return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    const invite: GroupInvite = {
      id: `invite-${group.id}-${Date.now()}`,
      groupId: group.id,
      code: `${group.id.replace(/[^A-Z0-9]/gi, '').toUpperCase()}1`.slice(0, 8).padEnd(8, '1'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      maxUses: null,
      currentUses: 0,
      createdAt: new Date().toISOString(),
    };
    writeMockGroupInvites([...readMockGroupInvites(), invite]);
    return HttpResponse.json(invite, { status: 201 });
  }),

  http.post(api('/groups/join'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Not allowed to join this group'), { status: 403 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Already a member'), { status: 409 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ code: 'Invalid invite code' }), { status: 400 });
    const body = await request.json() as { code: string };
    if (!/^[A-Z0-9]{8}$/.test(body.code)) {
      return HttpResponse.json(apiErrors.validation({ code: 'Code must be 8 alphanumeric characters' }), { status: 400 });
    }
    const invites = readMockGroupInvites();
    const invite = invites.find(i => i.code === body.code);
    if (!invite) return HttpResponse.json(apiErrors.notFound('Invite'), { status: 404 });
    const members = readMockGroupMembers();
    const currentUser = readMockCurrentUser();
    const existingMember = members.find(member => member.groupId === invite.groupId && member.userId === currentUser.id);
    if (existingMember) return HttpResponse.json(apiErrors.conflict('Already a member'), { status: 409 });
    const createdMember: GroupMember = {
      id: `mem-${invite.groupId}-${currentUser.id}`,
      groupId: invite.groupId,
      userId: currentUser.id,
      role: 'member',
      joinedAt: new Date().toISOString(),
      user: currentUser,
    };
    writeMockGroupMembers([...members, createdMember]);
    writeMockGroupInvites(invites.map(item => item.id === invite.id ? { ...item, currentUses: item.currentUses + 1 } : item));
    return HttpResponse.json(createdMember, { status: 201 });
  }),
];

// ── Restaurants ──────────────────────────────────────────────────────────
const restaurantHandlers = [
  http.get(api('/restaurants'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<Restaurant>());
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json(paginate(readMockRestaurants(), cursor, limit));
  }),

  http.get(api('/restaurants/nearby'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<Restaurant>());
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ lat: 'Required', lng: 'Required' }), { status: 400 });
    if (scenario === 'rate-limit') return HttpResponse.json(apiErrors.rateLimit(), { status: 429 });
    if (scenario === 'provider-failure') return HttpResponse.json(apiErrors.providerFailure('google'), { status: 503 });
    if (scenario === 'provider-failure-502') return HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 });
    if (scenario === 'provider-failure-504') return HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 });
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const lat = Number.parseFloat(url.searchParams.get('lat') ?? '');
    const lng = Number.parseFloat(url.searchParams.get('lng') ?? '');
    const radius = Number.parseFloat(url.searchParams.get('radius') ?? '5000');
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return HttpResponse.json(apiErrors.validation({ lat: 'Required', lng: 'Required' }), { status: 400 });
    }
    const restaurants = readMockRestaurants()
      .map((restaurant) => withDistanceFromOrigin(restaurant, { lat, lng }))
      .filter((restaurant): restaurant is Restaurant => restaurant !== null)
      .filter((restaurant) => restaurant.distanceMeters !== undefined && restaurant.distanceMeters <= radius)
      .sort((a, b) => (a.distanceMeters ?? 0) - (b.distanceMeters ?? 0));
    return HttpResponse.json(paginate(restaurants, cursor, limit));
  }),

  http.get(api('/restaurants/search'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<Restaurant>());
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const q = url.searchParams.get('q') ?? '';
    const restaurants = readMockRestaurants()
      .filter((restaurant) => textMatchesRestaurant(restaurant, q))
      .map(withoutDistance);
    return HttpResponse.json(paginate(restaurants, cursor, limit));
  }),

  http.get(api('/restaurants/:id'), ({ params }) => {
    const restaurant = readMockRestaurants().find(r => r.id === params['id']);
    if (!restaurant) return HttpResponse.json(apiErrors.notFound('Restaurant'), { status: 404 });
    return HttpResponse.json(restaurant);
  }),

  http.post(api('/restaurants'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ name: 'Required' }), { status: 400 });
    return HttpResponse.json(restaurantFixtures[0], { status: 201 });
  }),

  http.patch(api('/restaurants/:id'), async ({ params, request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Only the creator can update this restaurant'), { status: 403 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ latitude: 'Latitude and longitude must be provided together' }), { status: 400 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Restaurant already exists at this address'), { status: 409 });
    const restaurants = readMockRestaurants();
    const restaurant = restaurants.find(r => r.id === params['id']);
    if (!restaurant) return HttpResponse.json(apiErrors.notFound('Restaurant'), { status: 404 });
    const body = await request.json() as RestaurantUpdateRequest;
    const updatedRestaurant: Restaurant = {
      ...restaurant,
      ...body,
      latitude: body.latitude != null ? String(body.latitude) : restaurant.latitude,
      longitude: body.longitude != null ? String(body.longitude) : restaurant.longitude,
      updatedAt: new Date().toISOString(),
    };
    writeMockRestaurants(restaurants.map(item => item.id === updatedRestaurant.id ? updatedRestaurant : item));
    return HttpResponse.json(updatedRestaurant);
  }),

  http.delete(api('/restaurants/:id'), ({ params, request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Only the creator can delete this restaurant'), { status: 403 });
    const restaurants = readMockRestaurants();
    const restaurant = restaurants.find(r => r.id === params['id']);
    if (!restaurant) return HttpResponse.json(apiErrors.notFound('Restaurant'), { status: 404 });
    writeMockRestaurants(restaurants.filter(item => item.id !== params['id']));
    return new HttpResponse(null, { status: 204 });
  }),

  // External restaurants
  http.get(api('/external-restaurants/search'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'provider-failure') return HttpResponse.json(apiErrors.providerFailure('google'), { status: 503 });
    if (scenario === 'provider-failure-502') return HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 });
    if (scenario === 'provider-failure-504') return HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 });
    if (scenario === 'rate-limit') return HttpResponse.json(apiErrors.rateLimit(), { status: 429 });
    if (scenario === 'empty') return HttpResponse.json(emptyPage<Restaurant>());
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json(paginate(externalRestaurantFixtures, cursor, limit));
  }),

  http.post(api('/external-restaurants/import'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ provider: 'Required' }), { status: 400 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Restaurant already imported'), { status: 409 });
    if (scenario === 'provider-failure') return HttpResponse.json(apiErrors.providerFailure('google'), { status: 503 });
    if (scenario === 'provider-failure-502') return HttpResponse.json(apiErrors.providerFailure502('google'), { status: 502 });
    if (scenario === 'provider-failure-504') return HttpResponse.json(apiErrors.providerFailure504('google'), { status: 504 });
    return HttpResponse.json(importResponseFixture, { status: 201 });
  }),

  // Reviews
  http.get(api('/restaurants/:id/reviews'), ({ params, request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<RestaurantReview>());
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    const reviews = reviewFixtures.filter(review => review.restaurantId === params['id']);
    return HttpResponse.json(paginate(reviews, cursor, limit));
  }),

  http.post(api('/restaurants/:id/reviews'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ rating: 'Rating must be 1-5' }), { status: 400 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Review already exists for this restaurant'), { status: 409 });
    return HttpResponse.json(reviewFixtures[0], { status: 201 });
  }),

  http.patch(api('/reviews/:id'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('You do not have permission to edit this review'), { status: 403 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ rating: 'Rating must be 1-5' }), { status: 400 });
    if (scenario === 'not-found') return HttpResponse.json(apiErrors.notFound('Review'), { status: 404 });
    const body = await request.json() as { rating?: number; comment?: string };
    return HttpResponse.json({ ...reviewFixtures[0], ...body, updatedAt: new Date().toISOString() });
  }),

  http.delete(api('/reviews/:id'), ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('You do not have permission to delete this review'), { status: 403 });
    if (scenario === 'not-found') return HttpResponse.json(apiErrors.notFound('Review'), { status: 404 });
    return new HttpResponse(null, { status: 204 });
  }),
];

// ── Sessions ─────────────────────────────────────────────────────────────
const sessionHandlers = [
  http.get(api('/groups/:groupId/sessions'), ({ request, params }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<VoteSession>());
    const sessions = sessionFixtures.filter(s => s.groupId === params['groupId']);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json(paginate(sessions, cursor, limit));
  }),

  http.get(api('/sessions/:id'), ({ params }) => {
    const session = sessionFixtures.find(s => s.id === params['id']);
    if (!session) return HttpResponse.json(apiErrors.notFound('Session'), { status: 404 });
    return HttpResponse.json(session);
  }),

  http.post(api('/groups/:groupId/sessions'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ name: 'Required' }), { status: 400 });
    return HttpResponse.json(sessionFixtures[3], { status: 201 }); // draft
  }),

  http.patch(api('/sessions/:id'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...sessionFixtures[0], ...body });
  }),

  http.post(api('/sessions/:id/activate'), () => HttpResponse.json({ ...sessionFixtures[2], status: 'active' })),
  http.post(api('/sessions/:id/start-voting'), () => HttpResponse.json({ ...sessionFixtures[1], status: 'voting' })),
  http.post(api('/sessions/:id/select-restaurant'), async ({ request }) => {
    const body = await request.json() as { restaurantId: string };
    return HttpResponse.json({ ...sessionFixtures[0], selectedRestaurantId: body.restaurantId });
  }),
  http.post(api('/sessions/:id/complete'), () => HttpResponse.json({ ...sessionFixtures[0], status: 'completed' })),
  http.post(api('/sessions/:id/cancel'), () => HttpResponse.json({ ...sessionFixtures[6], status: 'cancelled' })),

  // Candidates
  http.get(api('/sessions/:id/candidates'), ({ params }) => {
    const candidates = candidateFixtures.filter(c => c.sessionId === params['id']);
    return HttpResponse.json(candidates);
  }),

  http.post(api('/sessions/:id/candidates'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Candidate already added'), { status: 409 });
    const body = await request.json() as { restaurantId: string };
    const newCandidate: SessionCandidate = { id: 'cand-new', sessionId: 'session-friday', restaurantId: body.restaurantId, addedBy: defaultUser.id, createdAt: new Date().toISOString(), restaurant: restaurantFixtures[0] };
    return HttpResponse.json(newCandidate, { status: 201 });
  }),

  http.delete(api('/sessions/:id/candidates/:candidateId'), () => new HttpResponse(null, { status: 204 })),

  // Votes
  http.post(api('/sessions/:id/votes'), async ({ params, request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Already voted'), { status: 409 });
    const body = await request.json() as { candidateId: string };
    const sessionId = String(params['id']);
    const currentVotes = readMockVotes();
    const existingVote = currentVotes.find(vote => vote.sessionId === sessionId && vote.userId === defaultUser.id && vote.candidateId === body.candidateId);
    if (existingVote) return HttpResponse.json(existingVote, { status: 200 });
    const createdAt = new Date().toISOString();
    const newVote: Vote = {
      id: `vote-new-${nextVoteIndex++}`,
      sessionId,
      candidateId: body.candidateId,
      userId: defaultUser.id,
      value: 1,
      createdAt,
    };
    writeMockVotes([
      ...currentVotes.filter(vote => !(vote.sessionId === sessionId && vote.userId === defaultUser.id)),
      newVote,
    ]);
    return HttpResponse.json(newVote, { status: 201 });
  }),

  http.get(api('/sessions/:id/votes'), ({ request, params }) => {
    const url = new URL(request.url);
    const session = sessionFixtures.find(s => s.id === params['id']);
    const sessionVotes = readMockVotes().filter(v => v.sessionId === params['id']);
    // During voting: only own votes. After completion: all votes.
    if (session && session.status === 'voting') {
      const ownVotes = sessionVotes.filter(v => v.userId === defaultUser.id);
      return HttpResponse.json(paginate(ownVotes, url.searchParams.get('cursor') ?? undefined, parseInt(url.searchParams.get('limit') ?? '20', 10)));
    }
    return HttpResponse.json(paginate(sessionVotes, url.searchParams.get('cursor') ?? undefined, parseInt(url.searchParams.get('limit') ?? '20', 10)));
  }),

  http.delete(api('/sessions/:id/votes/:voteId'), ({ params }) => {
    writeMockVotes(readMockVotes().filter(vote => vote.id !== params['voteId']));
    return new HttpResponse(null, { status: 204 });
  }),

  http.get(api('/sessions/:id/results'), ({ params }) => {
    const session = sessionFixtures.find(s => s.id === params['id']);
    if (!session || (session.status !== 'completed' && session.status !== 'voting')) {
      return HttpResponse.json(apiErrors.notFound('Results'), { status: 404 });
    }
    return HttpResponse.json(voteResultFixtures);
  }),
];

// ── Calls & Feedback ─────────────────────────────────────────────────────
const callHandlers = [
  http.get(api('/sessions/:sessionId/calls'), ({ request, params }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'empty') return HttpResponse.json(emptyPage<FoodCall>());
    const calls = callFixtures.filter(c => c.sessionId === params['sessionId']);
    const cursor = url.searchParams.get('cursor') ?? undefined;
    const limit = parseInt(url.searchParams.get('limit') ?? '20', 10);
    return HttpResponse.json(paginate(calls, cursor, limit));
  }),

  http.post(api('/sessions/:sessionId/calls'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Call already exists for this restaurant'), { status: 409 });
    const body = await request.json() as { restaurantId: string; pitch: string };
    return HttpResponse.json({ ...callFixtures[0], id: 'call-new', pitch: body.pitch }, { status: 201 });
  }),

  http.get(api('/calls/:id'), ({ params }) => {
    const call = callFixtures.find(c => c.id === params['id']);
    if (!call) return HttpResponse.json(apiErrors.notFound('Call'), { status: 404 });
    return HttpResponse.json(call);
  }),

  http.delete(api('/calls/:id'), () => new HttpResponse(null, { status: 204 })),

  // Call feedback
  http.get(api('/calls/:callId/feedback'), ({ params }) => {
    const feedback = feedbackFixtures.filter(f => f.callId === params['callId']);
    return HttpResponse.json(feedback);
  }),

  http.post(api('/calls/:callId/feedback'), async ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'conflict') return HttpResponse.json(apiErrors.conflict('Feedback already submitted'), { status: 409 });
    const body = await request.json() as { rating: number; comment?: string };
    return HttpResponse.json({ ...feedbackFixtures[0], id: 'fb-new', rating: body.rating, comment: body.comment ?? null }, { status: 201 });
  }),
];

// ── Recommendations ──────────────────────────────────────────────────────
const recommendationHandlers = [
  http.get(api('/sessions/:id/recommendations'), ({ request, params }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'provider-failure') return HttpResponse.json(apiErrors.providerFailure(), { status: 503 });
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Not a group member'), { status: 403 });
    if (scenario === 'not-found') return HttpResponse.json(apiErrors.notFound('Session'), { status: 404 });
    const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
    const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '10', 10);
    const sessionRecs = recommendationFixtures;
    if (params['id'] === 'session-empty') return HttpResponse.json(paginate([], cursor, limit));
    return HttpResponse.json(paginate(sessionRecs, cursor, limit));
  }),

  http.get(api('/groups/:id/recommendations'), ({ request, params }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'provider-failure') return HttpResponse.json(apiErrors.providerFailure(), { status: 503 });
    if (scenario === 'auth') return HttpResponse.json(apiErrors.unauthorized(), { status: 401 });
    if (scenario === 'permission') return HttpResponse.json(apiErrors.forbidden('Not a group member'), { status: 403 });
    if (scenario === 'not-found') return HttpResponse.json(apiErrors.notFound('Group'), { status: 404 });
    const cursor = new URL(request.url).searchParams.get('cursor') ?? undefined;
    const limit = parseInt(new URL(request.url).searchParams.get('limit') ?? '10', 10);
    const groupRecs = recommendationFixtures;
    if (params['id'] === 'group-empty') return HttpResponse.json(paginate([], cursor, limit));
    return HttpResponse.json(paginate(groupRecs, cursor, limit));
  }),
];

// ── Geo ──────────────────────────────────────────────────────────────────
const geoHandlers = [
  http.get(api('/geo/geocode'), ({ request }) => {
    const url = new URL(request.url);
    const scenario = getScenario(url);
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ q: 'Query required' }), { status: 400 });
    const q = (url.searchParams.get('q') ?? '').toLowerCase();
    if (q.includes('lille') || q.includes('kebab') || q.includes('bistrot')) {
      return HttpResponse.json([{ lat: 50.6292, lng: 3.0573, formattedAddress: 'Place du Général de Gaulle, Lille' }]);
    }
    return HttpResponse.json([geocodeFixture]);
  }),

  http.get(api('/geo/route'), ({ request }) => {
    const scenario = getScenario(new URL(request.url));
    if (scenario === 'validation') return HttpResponse.json(apiErrors.validation({ fromLat: 'Required' }), { status: 400 });
    return HttpResponse.json(routeFixture);
  }),
];

export const handlers = [
  ...authHandlers,
  ...userHandlers,
  ...groupHandlers,
  ...restaurantHandlers,
  ...sessionHandlers,
  ...callHandlers,
  ...recommendationHandlers,
  ...geoHandlers,
];
