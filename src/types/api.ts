export type ISODateString = string;
export type UUID = string;

// API §5/§6 - User model and /users/me responses.
export interface User { id: UUID; email: string; displayName: string; avatarUrl: string | null; reputationScore: number; createdAt: ISODateString; updatedAt: ISODateString; }

export type GroupRole = 'owner' | 'admin' | 'member';

// API §7 - Group entity. Monetary values and GPS coordinates are strings in API JSON responses.
export interface Group { id: UUID; name: string; description: string | null; createdBy: UUID; budgetMax: string | null; defaultStartAddress: string | null; defaultStartLatitude: string | null; defaultStartLongitude: string | null; defaultSearchRadiusMeters: number | null; createdAt: ISODateString; updatedAt: ISODateString; deletedAt: ISODateString | null; }

// API §7 - Group membership.
export interface GroupMember { id: UUID; groupId: UUID; userId: UUID; role: GroupRole; joinedAt: ISODateString; user?: User; }

// API §7 - Group invite.
export interface GroupInvite { id: UUID; groupId: UUID; code: string; expiresAt: ISODateString; maxUses: number | null; currentUses: number; createdAt: ISODateString; }

// API §7 - Group list item (includes member role).
export interface GroupListItem { id: UUID; name: string; description: string | null; role: GroupRole; budgetMax: string | null; createdAt: ISODateString; }

// API §7 - Group create/update request.
export interface GroupCreateRequest { name: string; description?: string; budgetMax?: number | null; defaultStartAddress?: string | null; defaultStartLatitude?: number | null; defaultStartLongitude?: number | null; defaultSearchRadiusMeters?: number | null; }
export interface GroupUpdateRequest { name?: string; description?: string | null; budgetMax?: number | null; defaultStartAddress?: string | null; defaultStartLatitude?: number | null; defaultStartLongitude?: number | null; defaultSearchRadiusMeters?: number | null; }

// API §8 - Restaurant entity. GPS coordinates are strings in API JSON responses.
export interface Restaurant { id: UUID; name: string; description: string | null; address: string; latitude: string; longitude: string; cuisineTags: string[]; photoUrls: string[]; phone: string | null; website: string | null; createdBy: UUID; createdAt: ISODateString; updatedAt?: ISODateString; deletedAt?: ISODateString | null; distanceMeters?: number; rating?: { average: number | null; count: number }; }

// API §8 - Restaurant detail rating aggregate.
export interface RestaurantRating { average: number | null; count: number; }

// API §8 - External restaurant search result.
export interface ExternalRestaurant { provider: string; providerPlaceId: string; name: string; address: string; latitude: number; longitude: number; phone: string | null; website: string | null; cuisineTags: string[]; photoUrls: string[]; distanceMeters?: number; durationSeconds?: number; routeSource?: string; sourcePayload?: Record<string, unknown>; }

// API §8 - External restaurant import response.
export interface ExternalRestaurantImportResponse { restaurant: Restaurant; source: { id: UUID; restaurantId: UUID; provider: string; providerPlaceId: string; name: string; address: string; latitude: string; longitude: string; sourcePayload: Record<string, unknown>; importedAt: ISODateString; }; imported: boolean; candidate: SessionCandidate | null; matchedBy: 'provider-source' | 'name-address' | 'none'; restaurantCreated: boolean; sourceLinked: boolean; sourceAction: 'created' | 'updated' | 'reused'; candidateAdded: boolean; transactional: boolean; }

// API §8 - External restaurant import request.
export interface ExternalRestaurantImportRequest { provider: string; providerPlaceId: string; sessionId?: UUID; }

// API §9 - Restaurant review.
export interface RestaurantReview { id: UUID; restaurantId: UUID; userId: UUID; sessionId: UUID; rating: number; comment: string | null; createdAt: ISODateString; updatedAt: ISODateString; deletedAt: ISODateString | null; }

// API §9 - Review create request.
export interface ReviewCreateRequest { sessionId: UUID; rating: number; comment?: string; }

// API §9 - Review update request.
export interface ReviewUpdateRequest { rating?: number; comment?: string | null; }

export type SessionStatus = 'draft' | 'active' | 'voting' | 'completed' | 'cancelled';
export type VoteType = 'approval' | 'ranking' | 'stars';

// API §11 - Vote session (full session detail).
export interface VoteSession { id: UUID; groupId: UUID; name: string; description: string | null; status: SessionStatus; voteType: VoteType; createdBy: UUID; deadline: ISODateString | null; startAddress: string | null; startLatitude: string | null; startLongitude: string | null; searchRadiusMeters: number | null; budgetMax: string | null; selectedRestaurantId: UUID | null; completedAt: ISODateString | null; createdAt: ISODateString; updatedAt?: ISODateString; }

// API §11 - Session create request.
export interface SessionCreateRequest { name: string; description?: string | null; deadline?: ISODateString | null; startAddress?: string | null; startLatitude?: number | null; startLongitude?: number | null; searchRadiusMeters?: number | null; budgetMax?: number | null; }

// API §11 - Session update request.
export interface SessionUpdateRequest { name?: string; description?: string | null; deadline?: ISODateString | null; }

// API §11 - Session select restaurant request.
export interface SessionSelectRestaurantRequest { restaurantId: UUID; }

// API §12 - Session candidate.
export interface SessionCandidate { id: UUID; sessionId: UUID; restaurantId: UUID; addedBy: UUID; createdAt: ISODateString; restaurant?: Restaurant; }

// API §12 - Candidate add request.
export interface CandidateAddRequest { restaurantId: UUID; }

// API §13 - Vote.
export interface Vote { id: UUID; sessionId: UUID; candidateId: UUID; userId: UUID; value: number; createdAt: ISODateString; }

// API §13 - Vote cast request.
export interface VoteCastRequest { candidateId: UUID; }

// API §13 - Vote results.
export interface VoteResult { candidateId: UUID; restaurantId: UUID; restaurantName: string; votes: number; creatorApproved: boolean; }

// API §14 - Food call.
export interface FoodCall { id: UUID; sessionId: UUID; restaurantId: UUID; userId: UUID; pitch: string; createdAt: ISODateString; restaurant?: Restaurant; group?: Group; }

// API §14 - Call create request.
export interface CallCreateRequest { restaurantId: UUID; pitch: string; }

// API §14 - Call feedback.
export interface CallFeedback { id: UUID; callId: UUID; userId: UUID; rating: number; comment: string | null; createdAt: ISODateString; }

// API §14 - Call feedback create request.
export interface CallFeedbackCreateRequest { rating: number; comment?: string | null; }

// API §15 - Recommendation item.
export interface RecommendationItem { restaurantId: UUID; restaurant: { id: UUID; name: string; address: string; latitude: number; longitude: number; estimatedCostPerPerson?: number }; rank: number; score: number; explanation: { summary: string; components: RecommendationExplanationComponent[]; }; }

// API §15 - Recommendation explanation component.
export interface RecommendationExplanationComponent { key: 'restaurantScore' | 'distance' | 'budget' | 'history'; score: number; weight: number; contribution: number; reason: string; }

// API §10 - Geocode result (provider-specific, kept as Record).
export type GeocodeResult = Record<string, unknown>;

// API §10 - Route result.
export interface GeoRouteResult { distance: number; duration: number; }

// API §4 - Authentication requests and responses.
export interface LoginRequest { email: string; password: string; }
export interface RegisterRequest { email: string; password: string; displayName: string; }
export interface ChangePasswordRequest { currentPassword: string; newPassword: string; }
export interface AuthResponse { accessToken: string; refreshToken: string; }
export interface RefreshRequest { refreshToken: string; }

// API §6 - User update request.
export interface UserUpdateRequest { email?: string; displayName?: string; }

// API §6 - Avatar upload request.
export interface AvatarUploadRequest { filename: string; contentType: string; base64: string; }

// API §18 - Cursor pagination envelope.
export interface CursorPage<T> { data: T[]; meta: { nextCursor: string | null }; }

// API §18 - Pagination query parameters.
export interface PaginationParams { cursor?: string; limit?: number; }

// API §19 - Standard error response.
export interface ApiErrorBody { statusCode: number; message: string | string[]; error: string; details?: Record<string, unknown>; }

// API §7 - Group join request.
export interface GroupJoinRequest { code: string; }

// API §8 - Restaurant create request.
export interface RestaurantCreateRequest { name: string; description?: string; address: string; latitude: number; longitude: number; cuisineTags?: string[]; photoUrls?: string[]; }

// API §8 - Restaurant update request.
export interface RestaurantUpdateRequest { name?: string; description?: string | null; address?: string; latitude?: number; longitude?: number; cuisineTags?: string[]; photoUrls?: string[]; }

// API §8 - Restaurant nearby search params.
export interface RestaurantNearbyParams { lat: number; lng: number; radius?: number; limit?: number; cursor?: string; }

// API §8 - Restaurant text search params.
export interface RestaurantSearchParams { q?: string; cursor?: string; limit?: number; }

// API §8 - External restaurant search params.
export interface ExternalRestaurantSearchParams { lat: number; lng: number; radius?: number; limit?: number; cursor?: string; q?: string; includeRoute?: boolean; strictRoute?: boolean; }

// API §10 - Geocode params.
export interface GeocodeParams { q: string; }

// API §10 - Route params.
export interface GeoRouteParams { fromLat: number; fromLng: number; toLat: number; toLng: number; }
