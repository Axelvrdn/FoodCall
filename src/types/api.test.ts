import { describe, expect, it } from 'vitest';
import type {
  ApiErrorBody,
  CursorPage,
  ExternalRestaurant,
  ExternalRestaurantImportResponse,
  GeoRouteResult,
  Group,
  GroupCreateRequest,
  GroupListItem,
  GroupRole,
  PaginationParams,
  RecommendationExplanationComponent,
  RestaurantReview,
  SessionCreateRequest,
  SessionStatus,
  VoteResult,
  VoteSession,
} from './api';

describe('API type contracts', () => {
  it('keeps GPS coordinates as strings in API responses', () => {
    const group: Pick<Group, 'defaultStartLatitude' | 'defaultStartLongitude'> = { defaultStartLatitude: '48.856600', defaultStartLongitude: '2.352200' };
    expect(typeof group.defaultStartLatitude).toBe('string');
    expect(typeof group.defaultStartLongitude).toBe('string');
  });

  it('keeps budget and monetary values as strings in API responses', () => {
    const group: Pick<Group, 'budgetMax'> = { budgetMax: '15.00' };
    expect(typeof group.budgetMax).toBe('string');
  });

  it('uses CursorPage<T> with data/meta.nextCursor envelope', () => {
    const page: CursorPage<Group> = { data: [], meta: { nextCursor: null } };
    expect(Array.isArray(page.data)).toBe(true);
    expect(page.meta).toBeDefined();
    expect(page.meta.nextCursor).toBeNull();
  });

  it('Group includes default start location and search radius', () => {
    const group: Group = {
      id: 'g1',
      name: 'Lunch Crew',
      description: null,
      createdBy: 'u1',
      budgetMax: '15.00',
      defaultStartAddress: '10 rue de Rivoli, Paris',
      defaultStartLatitude: '48.856600',
      defaultStartLongitude: '2.352200',
      defaultSearchRadiusMeters: 1500,
      createdAt: '2024-01-15T10:30:00.000Z',
      updatedAt: '2024-01-15T10:30:00.000Z',
      deletedAt: null,
    };
    expect(group.defaultStartAddress).toBe('10 rue de Rivoli, Paris');
    expect(group.defaultStartLatitude).toBe('48.856600');
    expect(group.defaultSearchRadiusMeters).toBe(1500);
  });

  it('GroupListItem includes role field', () => {
    const item: GroupListItem = { id: 'g1', name: 'Test', description: null, role: 'owner', budgetMax: '20.00', createdAt: '2024-01-15T10:30:00.000Z' };
    expect(item.role).toBe('owner');
  });

  it('ExternalRestaurant has number coordinates (not strings)', () => {
    const ext: Pick<ExternalRestaurant, 'latitude' | 'longitude'> = { latitude: 48.8566, longitude: 2.3522 };
    expect(typeof ext.latitude).toBe('number');
    expect(typeof ext.longitude).toBe('number');
  });

  it('ExternalRestaurantImportResponse contains audit fields', () => {
    const resp: Pick<ExternalRestaurantImportResponse, 'matchedBy' | 'restaurantCreated' | 'sourceLinked' | 'sourceAction' | 'transactional'> = { matchedBy: 'none', restaurantCreated: true, sourceLinked: true, sourceAction: 'created', transactional: true };
    expect(resp.matchedBy).toBe('none');
    expect(resp.sourceAction).toBe('created');
  });

  it('RestaurantReview has required sessionId', () => {
    const review: Pick<RestaurantReview, 'sessionId' | 'rating'> = { sessionId: 's1', rating: 5 };
    expect(review.rating).toBe(5);
  });

  it('RecommendationItem has explanation components', () => {
    const comp: RecommendationExplanationComponent = { key: 'restaurantScore', score: 90, weight: 0.5, contribution: 45, reason: 'Quality' };
    expect(comp.key).toBe('restaurantScore');
    expect(typeof comp.weight).toBe('number');
  });

  it('VoteResult has restaurantName and creatorApproved', () => {
    const result: VoteResult = { candidateId: 'c1', restaurantId: 'r1', restaurantName: 'Test', votes: 5, creatorApproved: true };
    expect(result.restaurantName).toBe('Test');
    expect(result.creatorApproved).toBe(true);
  });

  it('ApiErrorBody includes details field', () => {
    const err: ApiErrorBody = { statusCode: 400, message: 'Bad Request', error: 'Bad Request', details: { code: 'VALIDATION_ERROR' } };
    expect(err.details).toBeDefined();
  });

  it('GroupCreateRequest uses number for latitude/longitude and budget', () => {
    const req: GroupCreateRequest = { name: 'Test', budgetMax: 15, defaultStartLatitude: 48.8566, defaultStartLongitude: 2.3522 };
    expect(typeof req.budgetMax).toBe('number');
    expect(typeof req.defaultStartLatitude).toBe('number');
  });

  it('SessionStatus and GroupRole are union types with valid values', () => {
    const statuses: SessionStatus[] = ['draft', 'active', 'voting', 'completed', 'cancelled'];
    expect(statuses).toHaveLength(5);
    const roles: GroupRole[] = ['owner', 'admin', 'member'];
    expect(roles).toHaveLength(3);
  });

  it('PaginationParams has optional cursor and limit', () => {
    const params: PaginationParams = { cursor: '2024-01-10T08:00:00.000Z', limit: 20 };
    expect(params.cursor).toBeDefined();
    expect(params.limit).toBe(20);
    const empty: PaginationParams = {};
    expect(empty.cursor).toBeUndefined();
  });

  it('SessionCreateRequest uses number for coordinates and budget', () => {
    const req: SessionCreateRequest = { name: 'Lunch', startLatitude: 48.8566, startLongitude: 2.3522, budgetMax: 15 };
    expect(typeof req.startLatitude).toBe('number');
    expect(typeof req.budgetMax).toBe('number');
  });

  it('VoteSession includes start location and snapshot fields', () => {
    const session: Pick<VoteSession, 'startAddress' | 'startLatitude' | 'selectedRestaurantId'> = { startAddress: '10 rue de Rivoli', startLatitude: '48.856600', selectedRestaurantId: null };
    expect(typeof session.startLatitude).toBe('string');
    expect(session.selectedRestaurantId).toBeNull();
  });

  it('GeoRouteResult has distance and duration as numbers', () => {
    const route: GeoRouteResult = { distance: 1250, duration: 180 };
    expect(typeof route.distance).toBe('number');
    expect(typeof route.duration).toBe('number');
  });
});