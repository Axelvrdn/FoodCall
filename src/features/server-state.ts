import { useMutation, useQuery, useInfiniteQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { queryKeys } from './query-keys';
import type { NormalizedApiError } from '@/services/api-client';
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
} from '@/services';
import type {
  CursorPage,
  Group,
  GroupListItem,
  GroupCreateRequest,
  GroupUpdateRequest,
  GroupMember,
  GroupInvite,
  Restaurant,
  RestaurantUpdateRequest,
  ExternalRestaurant,
  ExternalRestaurantImportRequest,
  ExternalRestaurantImportResponse,
  VoteSession,
  SessionCandidate,
  Vote,
  VoteResult,
  FoodCall,
  CallFeedback,
  RestaurantReview,
  ReviewCreateRequest,
  RecommendationItem,
  GeocodeResult,
  GeoRouteResult,
} from '@/types/api';

type QOptions<T> = Omit<UseQueryOptions<T, NormalizedApiError, T>, 'queryKey' | 'queryFn'>;

function appendSessionCandidate(
  qc: ReturnType<typeof useQueryClient>,
  sessionId: string,
  candidate: SessionCandidate,
) {
  const normalizedCandidate = { ...candidate, sessionId };
  qc.setQueryData<SessionCandidate[]>(queryKeys.sessions.candidates(sessionId), (current) => {
    const candidates = current ?? [];
    if (candidates.some((item) => item.id === normalizedCandidate.id)) {
      return candidates.map((item) => item.id === normalizedCandidate.id ? normalizedCandidate : item);
    }
    return [...candidates, normalizedCandidate];
  });
}

function appendSessionVote(
  qc: ReturnType<typeof useQueryClient>,
  sessionId: string,
  vote: Vote,
) {
  const normalizedVote = { ...vote, sessionId };
  const appendVote = (current: CursorPage<Vote> | Vote[] | undefined) => {
    const page = Array.isArray(current)
      ? { data: current, meta: { nextCursor: null } }
      : current ?? { data: [], meta: { nextCursor: null } };
    const withoutOtherUserVotes = page.data.filter((item) => (
      item.id === normalizedVote.id || item.userId !== normalizedVote.userId
    ));
    if (withoutOtherUserVotes.some((item) => item.id === normalizedVote.id)) {
      return { ...page, data: withoutOtherUserVotes.map((item) => item.id === normalizedVote.id ? normalizedVote : item) };
    }
    return { ...page, data: [...withoutOtherUserVotes, normalizedVote] };
  };
  qc.setQueryData<CursorPage<Vote> | Vote[]>(queryKeys.sessions.votes(sessionId), appendVote);
  qc.setQueriesData<CursorPage<Vote> | Vote[]>({ queryKey: ['sessions', 'detail', sessionId, 'votes'] }, appendVote);
}

function removeSessionVote(
  qc: ReturnType<typeof useQueryClient>,
  sessionId: string,
  voteId: string,
) {
  const removeVote = (current: CursorPage<Vote> | Vote[] | undefined) => {
    if (!current) return current;
    const page = Array.isArray(current)
      ? { data: current, meta: { nextCursor: null } }
      : current;
    return { ...page, data: page.data.filter((vote) => vote.id !== voteId) };
  };
  qc.setQueryData<CursorPage<Vote> | Vote[]>(queryKeys.sessions.votes(sessionId), removeVote);
  qc.setQueriesData<CursorPage<Vote> | Vote[]>({ queryKey: ['sessions', 'detail', sessionId, 'votes'] }, removeVote);
}

function updateGroupMemberInCache(
  qc: ReturnType<typeof useQueryClient>,
  groupId: string,
  member: GroupMember,
) {
  const normalizedMember = { ...member, groupId };
  qc.setQueryData<GroupMember[]>(queryKeys.groups.members(groupId), (current) => {
    const members = current ?? [];
    if (members.some((item) => item.userId === normalizedMember.userId || item.id === normalizedMember.id)) {
      return members.map((item) => (
        item.userId === normalizedMember.userId || item.id === normalizedMember.id ? normalizedMember : item
      ));
    }
    return [...members, normalizedMember];
  });
}

function removeGroupMemberFromCache(
  qc: ReturnType<typeof useQueryClient>,
  groupId: string,
  userId: string,
) {
  qc.setQueryData<GroupMember[]>(queryKeys.groups.members(groupId), (current) => (
    current?.filter((member) => member.userId !== userId) ?? current
  ));
}

// ── Groups ──────────────────────────────────────────────
export function useGroupsQuery(cursor?: string, limit?: number, options?: QOptions<CursorPage<GroupListItem>>) {
  return useQuery({
    queryKey: queryKeys.groups.list(cursor),
    queryFn: () => groupsService.list(cursor, limit),
    ...options,
  });
}

export function useInfiniteGroupsQuery(limit?: number) {
  return useInfiniteQuery({
    queryKey: queryKeys.groups.list(),
    queryFn: ({ pageParam }) => groupsService.list(pageParam as string | undefined, limit),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: CursorPage<GroupListItem>) => lastPage.meta.nextCursor ?? undefined,
  });
}

export function useGroupQuery(id: string, options?: QOptions<Group>) {
  return useQuery({
    queryKey: queryKeys.groups.detail(id),
    queryFn: () => groupsService.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useGroupMembersQuery(groupId: string, options?: QOptions<GroupMember[]>) {
  return useQuery({
    queryKey: queryKeys.groups.members(groupId),
    queryFn: () => groupMembersService.list(groupId),
    enabled: !!groupId,
    ...options,
  });
}

export function useCreateGroupMutation() {
  const qc = useQueryClient();
  return useMutation<Group, NormalizedApiError, GroupCreateRequest>({
    mutationFn: groupsService.create,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.groups.all }); },
  });
}

export function useUpdateGroupMutation() {
  const qc = useQueryClient();
  return useMutation<Group, NormalizedApiError, { id: string; payload: GroupUpdateRequest }>({
    mutationFn: ({ id, payload }) => groupsService.update(id, payload),
    onSuccess: (group, { id }) => {
      qc.setQueryData(queryKeys.groups.detail(id), group);
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useDeleteGroupMutation() {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, string>({
    mutationFn: groupsService.delete,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.groups.all }); },
  });
}

export function useCreateInviteMutation() {
  const qc = useQueryClient();
  return useMutation<GroupInvite, NormalizedApiError, string>({
    mutationFn: groupInvitesService.create,
    onSuccess: (_data, groupId) => { qc.invalidateQueries({ queryKey: queryKeys.groups.invites(groupId) }); },
  });
}

export function useJoinGroupMutation() {
  const qc = useQueryClient();
  return useMutation<GroupMember, NormalizedApiError, string>({
    mutationFn: groupInvitesService.join,
    onSuccess: () => { qc.invalidateQueries({ queryKey: queryKeys.groups.all }); },
  });
}

export function useUpdateGroupMemberRoleMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation<GroupMember, NormalizedApiError, { userId: string; role: GroupMember['role'] }>({
    mutationFn: ({ userId, role }) => groupMembersService.updateRole(groupId, userId, role),
    onSuccess: (member) => {
      updateGroupMemberInCache(qc, groupId, member);
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

export function useRemoveGroupMemberMutation(groupId: string) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (userId) => groupMembersService.remove(groupId, userId),
    onSuccess: (_data, userId) => {
      removeGroupMemberFromCache(qc, groupId, userId);
      qc.invalidateQueries({ queryKey: queryKeys.groups.detail(groupId) });
      qc.invalidateQueries({ queryKey: queryKeys.groups.all });
    },
  });
}

// ── Restaurants ─────────────────────────────────────────
export function useRestaurantsNearbyQuery(
  params: { lat: number; lng: number; radius?: number; limit?: number; cursor?: string },
  options?: QOptions<CursorPage<Restaurant>>,
) {
  return useQuery({
    queryKey: queryKeys.restaurants.nearby(params),
    queryFn: () => restaurantsService.nearby(params.lat, params.lng, params.radius, params.limit, params.cursor),
    enabled: !isNaN(params.lat) && !isNaN(params.lng),
    ...options,
  });
}

export function useRestaurantsSearchQuery(q?: string, cursor?: string, limit?: number, options?: QOptions<CursorPage<Restaurant>>) {
  return useQuery({
    queryKey: queryKeys.restaurants.search(q, cursor, limit),
    queryFn: () => restaurantsService.search(q, cursor, limit),
    ...options,
  });
}

export function useRestaurantQuery(id: string, options?: QOptions<Restaurant>) {
  return useQuery({
    queryKey: queryKeys.restaurants.detail(id),
    queryFn: () => restaurantsService.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useUpdateRestaurantMutation(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation<Restaurant, NormalizedApiError, RestaurantUpdateRequest>({
    mutationFn: (payload) => restaurantsService.update(restaurantId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.restaurants.detail(restaurantId), refetchType: 'all' });
      qc.invalidateQueries({ queryKey: queryKeys.restaurants.all });
    },
  });
}

export function useDeleteRestaurantMutation(restaurantId: string) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, void>({
    mutationFn: () => restaurantsService.delete(restaurantId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.restaurants.detail(restaurantId), refetchType: 'all' });
      qc.invalidateQueries({ queryKey: queryKeys.restaurants.all });
    },
  });
}

export function useRestaurantReviewsQuery(restaurantId: string, cursor?: string, limit?: number, options?: QOptions<CursorPage<RestaurantReview>>) {
  return useQuery({
    queryKey: queryKeys.restaurants.reviews(restaurantId, cursor),
    queryFn: () => reviewsService.list(restaurantId, cursor, limit),
    enabled: !!restaurantId,
    ...options,
  });
}

export function useExternalRestaurantsSearchQuery(
  params: { lat: number; lng: number; radius?: number; q?: string; limit?: number; cursor?: string; includeRoute?: boolean; strictRoute?: boolean },
  options?: QOptions<CursorPage<ExternalRestaurant>>,
) {
  return useQuery({
    queryKey: queryKeys.externalRestaurants.search(params),
    queryFn: () => externalRestaurantsService.search(params),
    enabled: !isNaN(params.lat) && !isNaN(params.lng),
    ...options,
  });
}

export function useImportExternalRestaurantMutation() {
  const qc = useQueryClient();
  return useMutation<ExternalRestaurantImportResponse, NormalizedApiError, ExternalRestaurantImportRequest>({
    mutationFn: externalRestaurantsService.import,
    onSuccess: (data, payload) => {
      qc.invalidateQueries({ queryKey: queryKeys.restaurants.all });
      qc.invalidateQueries({ queryKey: queryKeys.externalRestaurants.all });
      if (payload.sessionId && data.candidate) {
        appendSessionCandidate(qc, payload.sessionId, data.candidate);
      }
    },
  });
}

// ── Sessions ────────────────────────────────────────────
export function useGroupSessionsQuery(groupId: string, cursor?: string, limit?: number, options?: QOptions<CursorPage<VoteSession>>) {
  return useQuery({
    queryKey: queryKeys.groups.sessions(groupId, cursor),
    queryFn: () => sessionsService.list(groupId, cursor, limit),
    enabled: !!groupId,
    ...options,
  });
}

export function useSessionQuery(id: string, options?: QOptions<VoteSession>) {
  return useQuery({
    queryKey: queryKeys.sessions.detail(id),
    queryFn: () => sessionsService.get(id),
    enabled: !!id,
    ...options,
  });
}

export function useSessionCandidatesQuery(sessionId: string, options?: QOptions<SessionCandidate[]>) {
  return useQuery({
    queryKey: queryKeys.sessions.candidates(sessionId),
    queryFn: () => candidatesService.list(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

export function useSessionVotesQuery(sessionId: string, cursor?: string, limit?: number, options?: QOptions<CursorPage<Vote>>) {
  return useQuery({
    queryKey: queryKeys.sessions.votes(sessionId, cursor),
    queryFn: () => votesService.list(sessionId, cursor, limit),
    enabled: !!sessionId,
    ...options,
  });
}

export function useSessionResultsQuery(sessionId: string, options?: QOptions<VoteResult[]>) {
  return useQuery({
    queryKey: queryKeys.sessions.results(sessionId),
    queryFn: () => votesService.results(sessionId),
    enabled: !!sessionId,
    ...options,
  });
}

export function useSessionCallsQuery(sessionId: string, cursor?: string, limit?: number, options?: QOptions<CursorPage<FoodCall>>) {
  return useQuery({
    queryKey: queryKeys.sessions.calls(sessionId, cursor),
    queryFn: () => callsService.list(sessionId, cursor, limit),
    enabled: !!sessionId,
    ...options,
  });
}

export function useSessionRecommendationsQuery(sessionId: string, limit?: number, cursor?: string, options?: QOptions<CursorPage<RecommendationItem>>) {
  return useQuery({
    queryKey: queryKeys.sessions.recommendations(sessionId),
    queryFn: () => recommendationsService.forSession(sessionId, limit, cursor),
    enabled: !!sessionId,
    ...options,
  });
}

export function useGroupRecommendationsQuery(groupId: string, limit?: number, cursor?: string, options?: QOptions<CursorPage<RecommendationItem>>) {
  return useQuery({
    queryKey: queryKeys.groups.recommendations(groupId),
    queryFn: () => recommendationsService.forGroup(groupId, limit, cursor),
    enabled: !!groupId,
    ...options,
  });
}

// ── Session mutations ───────────────────────────────────
export function useCreateSessionMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, { groupId: string; payload: Parameters<typeof sessionsService.create>[1] }>({
    mutationFn: ({ groupId, payload }) => sessionsService.create(groupId, payload),
    onSuccess: (_data, { groupId }) => { qc.invalidateQueries({ queryKey: queryKeys.groups.sessions(groupId) }); },
  });
}

export function useActivateSessionMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, string>({
    mutationFn: sessionsService.activate,
    onSuccess: (_data, id) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) }); },
  });
}

export function useStartVotingMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, string>({
    mutationFn: sessionsService.startVoting,
    onSuccess: (_data, id) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) }); },
  });
}

export function useSelectRestaurantMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, { id: string; restaurantId: string }>({
    mutationFn: ({ id, restaurantId }) => sessionsService.selectRestaurant(id, restaurantId),
    onSuccess: (_data, { id }) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) }); },
  });
}

export function useCompleteSessionMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, string>({
    mutationFn: sessionsService.complete,
    onSuccess: (_data, id) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) }); },
  });
}

export function useCancelSessionMutation() {
  const qc = useQueryClient();
  return useMutation<VoteSession, NormalizedApiError, string>({
    mutationFn: sessionsService.cancel,
    onSuccess: (_data, id) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(id) }); },
  });
}

// ── Candidate mutations ─────────────────────────────────
export function useAddCandidateMutation() {
  const qc = useQueryClient();
  return useMutation<SessionCandidate, NormalizedApiError, { sessionId: string; restaurantId: string }>({
    mutationFn: ({ sessionId, restaurantId }) => candidatesService.add(sessionId, restaurantId),
    onSuccess: (data, { sessionId }) => { appendSessionCandidate(qc, sessionId, data); },
  });
}

export function useRemoveCandidateMutation() {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, { sessionId: string; candidateId: string }>({
    mutationFn: ({ sessionId, candidateId }) => candidatesService.remove(sessionId, candidateId),
    onSuccess: (_data, { sessionId }) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.candidates(sessionId) }); },
  });
}

// ── Vote mutations ──────────────────────────────────────
export function useCastVoteMutation() {
  const qc = useQueryClient();
  return useMutation<Vote, NormalizedApiError, { sessionId: string; candidateId: string }>({
    mutationFn: ({ sessionId, candidateId }) => votesService.cast(sessionId, candidateId),
    onSuccess: (data, { sessionId }) => {
      appendSessionVote(qc, sessionId, data);
      qc.invalidateQueries({ queryKey: queryKeys.sessions.results(sessionId) });
    },
  });
}

export function useDeleteVoteMutation(sessionId: string) {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, string>({
    mutationFn: (voteId) => votesService.delete(sessionId, voteId),
    onMutate: (voteId) => {
      removeSessionVote(qc, sessionId, voteId);
    },
    onSuccess: (_data, voteId) => {
      removeSessionVote(qc, sessionId, voteId);
      qc.invalidateQueries({ queryKey: queryKeys.sessions.results(sessionId) });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.detail(sessionId) });
    },
  });
}

// ── Call mutations ──────────────────────────────────────
export function useCreateCallMutation() {
  const qc = useQueryClient();
  return useMutation<FoodCall, NormalizedApiError, { sessionId: string; payload: { restaurantId: string; pitch: string } }>({
    mutationFn: ({ sessionId, payload }) => callsService.create(sessionId, payload),
    onSuccess: (_data, { sessionId }) => { qc.invalidateQueries({ queryKey: queryKeys.sessions.calls(sessionId) }); },
  });
}

export function useDeleteCallMutation() {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, { callId: string; sessionId?: string }>({
    mutationFn: ({ callId }) => callsService.delete(callId),
    onSuccess: (_data, { sessionId }) => { if (sessionId) qc.invalidateQueries({ queryKey: queryKeys.sessions.calls(sessionId) }); },
  });
}

// ── Call feedback ───────────────────────────────────────
export function useCallFeedbackQuery(callId: string, options?: QOptions<CallFeedback[]>) {
  return useQuery({
    queryKey: queryKeys.calls.feedback(callId),
    queryFn: () => callFeedbackService.list(callId),
    enabled: !!callId,
    ...options,
  });
}

export function useCreateFeedbackMutation() {
  const qc = useQueryClient();
  return useMutation<CallFeedback, NormalizedApiError, { callId: string; rating: number; comment?: string }>({
    mutationFn: ({ callId, rating, comment }) => callFeedbackService.create(callId, { rating, comment }),
    onSuccess: (_data, { callId }) => { qc.invalidateQueries({ queryKey: queryKeys.calls.feedback(callId) }); },
  });
}

// ── Review mutations ─────────────────────────────────────
export function useCreateReviewMutation() {
  const qc = useQueryClient();
  return useMutation<RestaurantReview, NormalizedApiError, { restaurantId: string; payload: ReviewCreateRequest }>({
    mutationFn: ({ restaurantId, payload }) => reviewsService.create(restaurantId, payload),
    onSuccess: (_data, { restaurantId }) => { qc.invalidateQueries({ queryKey: queryKeys.restaurants.reviews(restaurantId) }); },
  });
}

export function useUpdateReviewMutation() {
  const qc = useQueryClient();
  return useMutation<RestaurantReview, NormalizedApiError, { reviewId: string; restaurantId: string; payload: { rating?: number; comment?: string | null } }>({
    mutationFn: ({ reviewId, payload }) => reviewsService.update(reviewId, payload),
    onSuccess: (_data, { restaurantId }) => { qc.invalidateQueries({ queryKey: queryKeys.restaurants.reviews(restaurantId) }); },
  });
}

export function useDeleteReviewMutation() {
  const qc = useQueryClient();
  return useMutation<void, NormalizedApiError, { reviewId: string; restaurantId: string }>({
    mutationFn: ({ reviewId }) => reviewsService.delete(reviewId),
    onSuccess: (_data, { restaurantId }) => { qc.invalidateQueries({ queryKey: queryKeys.restaurants.reviews(restaurantId) }); },
  });
}

// ── Geo ─────────────────────────────────────────────────
export function useGeocodeQuery(q: string, options?: QOptions<GeocodeResult>) {
  return useQuery({
    queryKey: queryKeys.geo.geocode(q),
    queryFn: () => geoService.geocode(q),
    enabled: q.length > 0,
    ...options,
  });
}

export function useRouteQuery(params: { fromLat: number; fromLng: number; toLat: number; toLng: number }, options?: QOptions<GeoRouteResult>) {
  return useQuery({
    queryKey: queryKeys.geo.route(params),
    queryFn: () => geoService.route(params),
    enabled: !isNaN(params.fromLat) && !isNaN(params.toLat),
    ...options,
  });
}
