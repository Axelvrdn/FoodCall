import { API_ROUTES, buildApiRoute } from '@/lib';
import { apiClient } from './api-client';
import type {
  CallFeedback,
  CursorPage,
  ExternalRestaurant,
  ExternalRestaurantImportRequest,
  ExternalRestaurantImportResponse,
  FoodCall,
  GeocodeResult,
  GeoRouteResult,
  Group,
  GroupCreateRequest,
  GroupInvite,
  GroupListItem,
  GroupMember,
  GroupUpdateRequest,
  RecommendationItem,
  Restaurant,
  RestaurantCreateRequest,
  RestaurantReview,
  RestaurantUpdateRequest,
  ReviewCreateRequest,
  ReviewUpdateRequest,
  SessionCandidate,
  VoteResult,
  VoteSession,
  Vote,
} from '@/types/api';

export const groupsService = {
  list: (cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<GroupListItem>>(API_ROUTES.groups, { params: { cursor, limit } }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<Group>(buildApiRoute(API_ROUTES.groupDetail, { id })).then((r) => r.data),
  create: (payload: GroupCreateRequest) =>
    apiClient.post<Group>(API_ROUTES.groups, payload).then((r) => r.data),
  update: (id: string, payload: GroupUpdateRequest) =>
    apiClient.patch<Group>(buildApiRoute(API_ROUTES.groupUpdate, { id }), payload).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.groupDelete, { id })).then(() => undefined),
};

export const groupMembersService = {
  list: (groupId: string) =>
    apiClient.get<GroupMember[]>(buildApiRoute(API_ROUTES.groupMembers, { id: groupId })).then((r) => r.data),
  updateRole: (groupId: string, userId: string, role: string) =>
    apiClient.patch<GroupMember>(buildApiRoute(API_ROUTES.groupMemberRole, { id: groupId, userId }), { role }).then((r) => r.data),
  remove: (groupId: string, userId: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.groupMemberRemove, { id: groupId, userId })).then(() => undefined),
};

export const groupInvitesService = {
  create: (groupId: string) =>
    apiClient.post<GroupInvite>(buildApiRoute(API_ROUTES.groupInvites, { id: groupId })).then((r) => r.data),
  join: (code: string) =>
    apiClient.post<GroupMember>(buildApiRoute(API_ROUTES.groupJoin), { code }).then((r) => r.data),
};

function normalizeRestaurant(restaurant: Restaurant): Restaurant {
  return {
    ...restaurant,
    description: restaurant.description ?? null,
    cuisineTags: Array.isArray(restaurant.cuisineTags) ? restaurant.cuisineTags : [],
    photoUrls: Array.isArray(restaurant.photoUrls) ? restaurant.photoUrls : [],
    phone: restaurant.phone ?? null,
    website: restaurant.website ?? null,
    createdBy: restaurant.createdBy ?? '',
  };
}

function normalizeRestaurantPage(page: CursorPage<Restaurant>): CursorPage<Restaurant> {
  return {
    ...page,
    data: page.data.map(normalizeRestaurant),
  };
}

export const restaurantsService = {
  list: (cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<Restaurant>>(API_ROUTES.restaurants, { params: { cursor, limit } }).then((r) => normalizeRestaurantPage(r.data)),
  nearby: (lat: number, lng: number, radius?: number, limit?: number, cursor?: string) =>
    apiClient.get<CursorPage<Restaurant>>(API_ROUTES.restaurantsNearby, { params: { lat, lng, radius, limit, cursor } }).then((r) => normalizeRestaurantPage(r.data)),
  search: (q?: string, cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<Restaurant>>(API_ROUTES.restaurantsSearch, { params: { q, cursor, limit } }).then((r) => normalizeRestaurantPage(r.data)),
  get: (id: string) =>
    apiClient.get<Restaurant>(buildApiRoute(API_ROUTES.restaurantDetail, { id })).then((r) => normalizeRestaurant(r.data)),
  create: (payload: RestaurantCreateRequest) =>
    apiClient.post<Restaurant>(API_ROUTES.restaurants, payload).then((r) => normalizeRestaurant(r.data)),
  update: (id: string, payload: RestaurantUpdateRequest) =>
    apiClient.patch<Restaurant>(buildApiRoute(API_ROUTES.restaurantDetail, { id }), payload).then((r) => normalizeRestaurant(r.data)),
  delete: (id: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.restaurantDetail, { id })).then(() => undefined),
};

export const externalRestaurantsService = {
  search: (params: { lat: number; lng: number; radius?: number; limit?: number; cursor?: string; q?: string; includeRoute?: boolean; strictRoute?: boolean }) =>
    apiClient.get<CursorPage<ExternalRestaurant>>(API_ROUTES.externalRestaurantsSearch, { params }).then((r) => r.data),
  import: (payload: ExternalRestaurantImportRequest) =>
    apiClient.post<ExternalRestaurantImportResponse>(API_ROUTES.externalRestaurantsImport, payload).then((r) => r.data),
};

export const sessionsService = {
  list: (groupId: string, cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<VoteSession>>(buildApiRoute(API_ROUTES.groupSessions, { id: groupId }), { params: { cursor, limit } }).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<VoteSession>(buildApiRoute(API_ROUTES.sessionDetail, { id })).then((r) => r.data),
  create: (groupId: string, payload: { name: string; description?: string; voteType?: string; startLatitude?: number; startLongitude?: number; startAddress?: string; searchRadiusMeters?: number; budgetMax?: number }) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.groupSessions, { id: groupId }), payload).then((r) => r.data),
  update: (id: string, payload: { name?: string; description?: string }) =>
    apiClient.patch<VoteSession>(buildApiRoute(API_ROUTES.sessionUpdate, { id }), payload).then((r) => r.data),
  activate: (id: string) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.sessionActivate, { id })).then((r) => r.data),
  startVoting: (id: string) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.sessionStartVoting, { id })).then((r) => r.data),
  selectRestaurant: (id: string, restaurantId: string) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.sessionSelectRestaurant, { id }), { restaurantId }).then((r) => r.data),
  complete: (id: string) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.sessionComplete, { id })).then((r) => r.data),
  cancel: (id: string) =>
    apiClient.post<VoteSession>(buildApiRoute(API_ROUTES.sessionCancel, { id })).then((r) => r.data),
};

export const candidatesService = {
  list: (sessionId: string) =>
    apiClient.get<SessionCandidate[]>(buildApiRoute(API_ROUTES.sessionCandidates, { id: sessionId })).then((r) => r.data),
  add: (sessionId: string, restaurantId: string) =>
    apiClient.post<SessionCandidate>(buildApiRoute(API_ROUTES.sessionCandidates, { id: sessionId }), { restaurantId }).then((r) => r.data),
  remove: (sessionId: string, candidateId: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.sessionCandidateRemove, { id: sessionId, candidateId })).then(() => undefined),
};

export const votesService = {
  cast: (sessionId: string, candidateId: string) =>
    apiClient.post<Vote>(buildApiRoute(API_ROUTES.sessionVotes, { id: sessionId }), { candidateId }).then((r) => r.data),
  list: (sessionId: string, cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<Vote>>(buildApiRoute(API_ROUTES.sessionVotes, { id: sessionId }), { params: { cursor, limit } }).then((r) => r.data),
  delete: (sessionId: string, voteId: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.sessionVoteDetail, { id: sessionId, voteId })).then(() => undefined),
  results: (sessionId: string) =>
    apiClient.get<VoteResult[]>(buildApiRoute(API_ROUTES.sessionResults, { id: sessionId })).then((r) => r.data),
};

export const callsService = {
  list: (sessionId: string, cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<FoodCall>>(buildApiRoute(API_ROUTES.sessionCalls, { id: sessionId }), { params: { cursor, limit } }).then((r) => r.data),
  create: (sessionId: string, payload: { restaurantId: string; pitch: string }) =>
    apiClient.post<FoodCall>(buildApiRoute(API_ROUTES.sessionCalls, { id: sessionId }), payload).then((r) => r.data),
  get: (id: string) =>
    apiClient.get<FoodCall>(buildApiRoute(API_ROUTES.callDetail, { id })).then((r) => r.data),
  delete: (id: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.callDetail, { id })).then(() => undefined),
};

export const callFeedbackService = {
  list: (callId: string) =>
    apiClient.get<CallFeedback[]>(buildApiRoute(API_ROUTES.callFeedback, { id: callId })).then((r) => r.data),
  create: (callId: string, payload: { rating: number; comment?: string }) =>
    apiClient.post<CallFeedback>(buildApiRoute(API_ROUTES.callFeedback, { id: callId }), payload).then((r) => r.data),
};

export const reviewsService = {
  list: (restaurantId: string, cursor?: string, limit?: number) =>
    apiClient.get<CursorPage<RestaurantReview>>(buildApiRoute(API_ROUTES.restaurantReviews, { id: restaurantId }), { params: { cursor, limit } }).then((r) => r.data),
  create: (restaurantId: string, payload: ReviewCreateRequest) =>
    apiClient.post<RestaurantReview>(buildApiRoute(API_ROUTES.restaurantReviews, { id: restaurantId }), payload).then((r) => r.data),
  update: (reviewId: string, payload: ReviewUpdateRequest) =>
    apiClient.patch<RestaurantReview>(buildApiRoute(API_ROUTES.reviewUpdate, { id: reviewId }), payload).then((r) => r.data),
  delete: (reviewId: string) =>
    apiClient.delete<void>(buildApiRoute(API_ROUTES.reviewDelete, { id: reviewId })).then(() => undefined),
};

export const recommendationsService = {
  forSession: (sessionId: string, limit?: number, cursor?: string) =>
    apiClient.get<CursorPage<RecommendationItem>>(buildApiRoute(API_ROUTES.sessionRecommendations, { id: sessionId }), { params: { limit, cursor } }).then((r) => r.data),
  forGroup: (groupId: string, limit?: number, cursor?: string) =>
    apiClient.get<CursorPage<RecommendationItem>>(buildApiRoute(API_ROUTES.groupRecommendations, { id: groupId }), { params: { limit, cursor } }).then((r) => r.data),
};

export const geoService = {
  geocode: (q: string) =>
    apiClient.get<GeocodeResult>(API_ROUTES.geoGeocode, { params: { q } }).then((r) => r.data),
  route: (params: { fromLat: number; fromLng: number; toLat: number; toLng: number }) =>
    apiClient.get<GeoRouteResult>(API_ROUTES.geoRoute, { params }).then((r) => r.data),
};
