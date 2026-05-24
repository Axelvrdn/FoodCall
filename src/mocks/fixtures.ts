import type {
  ApiErrorBody,
  CallFeedback,
  CursorPage,
  ExternalRestaurant,
  ExternalRestaurantImportResponse,
  FoodCall,
  GeocodeResult,
  GeoRouteResult,
  Group,
  GroupInvite,
  GroupListItem,
  GroupMember,
  RecommendationItem,
  Restaurant,
  RestaurantReview,
  SessionCandidate,
  User,
  Vote,
  VoteResult,
  VoteSession,
} from '@/types/api';

// ── Users ────────────────────────────────────────────────────────────────
export const userFixtures: User[] = [
  { id: 'user-alice', email: 'alice@example.com', displayName: 'Alice', avatarUrl: null, reputationScore: 1200, createdAt: '2026-04-01T08:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  { id: 'user-ben', email: 'ben@example.com', displayName: 'Ben', avatarUrl: null, reputationScore: 980, createdAt: '2026-04-05T09:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  { id: 'user-chloe', email: 'chloe@example.com', displayName: 'Chloe', avatarUrl: null, reputationScore: 1500, createdAt: '2026-04-10T07:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  { id: 'user-david', email: 'david@example.com', displayName: 'David', avatarUrl: null, reputationScore: 700, createdAt: '2026-04-15T11:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  { id: 'user-emma', email: 'emma@example.com', displayName: 'Emma', avatarUrl: null, reputationScore: 450, createdAt: '2026-04-20T12:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
  { id: 'user-frank', email: 'frank@example.com', displayName: 'Frank', avatarUrl: null, reputationScore: 650, createdAt: '2026-04-25T13:00:00.000Z', updatedAt: '2026-05-18T10:00:00.000Z' },
];

export const defaultUser = userFixtures[0];

// ── Groups ───────────────────────────────────────────────────────────────
export const groupFixtures: Group[] = [
  {
    id: 'group-lille',
    name: 'Lille Lunch Crew',
    description: 'Choisir vite et bien autour du bureau.',
    createdBy: 'user-alice',
    budgetMax: '20.00',
    defaultStartAddress: 'Place du Général de Gaulle, Lille',
    defaultStartLatitude: '50.629200',
    defaultStartLongitude: '3.057300',
    defaultSearchRadiusMeters: 2000,
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'group-paris',
    name: 'Paris Dinner Club',
    description: 'Dîners entre amis dans le quartier.',
    createdBy: 'user-chloe',
    budgetMax: '35.00',
    defaultStartAddress: '10 Rue de Rivoli, Paris',
    defaultStartLatitude: '48.856600',
    defaultStartLongitude: '2.352200',
    defaultSearchRadiusMeters: 3000,
    createdAt: '2026-04-10T08:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
    deletedAt: null,
  },
  {
    id: 'group-lyon',
    name: 'Lyon Weekend Bites',
    description: 'Bonnes adresses du week-end.',
    createdBy: 'user-frank',
    budgetMax: null,
    defaultStartAddress: null,
    defaultStartLatitude: null,
    defaultStartLongitude: null,
    defaultSearchRadiusMeters: null,
    createdAt: '2026-04-20T09:00:00.000Z',
    updatedAt: '2026-05-15T10:00:00.000Z',
    deletedAt: null,
  },
];

export const groupListFixtures: GroupListItem[] = [
  { id: 'group-lille', name: 'Lille Lunch Crew', description: 'Choisir vite et bien autour du bureau.', role: 'owner', budgetMax: '20.00', createdAt: '2026-04-02T10:00:00.000Z' },
  { id: 'group-paris', name: 'Paris Dinner Club', description: 'Dîners entre amis dans le quartier.', role: 'admin', budgetMax: '35.00', createdAt: '2026-04-10T08:00:00.000Z' },
  { id: 'group-lyon', name: 'Lyon Weekend Bites', description: 'Bonnes adresses du week-end.', role: 'member', budgetMax: null, createdAt: '2026-04-20T09:00:00.000Z' },
];

// ── Group Members ────────────────────────────────────────────────────────
export const memberFixtures: GroupMember[] = [
  { id: 'mem-l1', groupId: 'group-lille', userId: 'user-alice', role: 'owner', joinedAt: '2026-04-02T10:00:00.000Z', user: userFixtures[0] },
  { id: 'mem-l2', groupId: 'group-lille', userId: 'user-ben', role: 'admin', joinedAt: '2026-04-02T10:05:00.000Z', user: userFixtures[1] },
  { id: 'mem-l3', groupId: 'group-lille', userId: 'user-chloe', role: 'member', joinedAt: '2026-04-02T10:10:00.000Z', user: userFixtures[2] },
  { id: 'mem-l4', groupId: 'group-lille', userId: 'user-david', role: 'member', joinedAt: '2026-04-02T10:15:00.000Z', user: userFixtures[3] },
  { id: 'mem-p1', groupId: 'group-paris', userId: 'user-chloe', role: 'owner', joinedAt: '2026-04-10T08:00:00.000Z', user: userFixtures[2] },
  { id: 'mem-p2', groupId: 'group-paris', userId: 'user-david', role: 'admin', joinedAt: '2026-04-10T08:05:00.000Z', user: userFixtures[3] },
  { id: 'mem-p3', groupId: 'group-paris', userId: 'user-emma', role: 'member', joinedAt: '2026-04-10T08:10:00.000Z', user: userFixtures[4] },
  { id: 'mem-y1', groupId: 'group-lyon', userId: 'user-frank', role: 'owner', joinedAt: '2026-04-20T09:00:00.000Z', user: userFixtures[5] },
  { id: 'mem-y2', groupId: 'group-lyon', userId: 'user-alice', role: 'member', joinedAt: '2026-04-20T09:05:00.000Z', user: userFixtures[0] },
];

// ── Group Invites ─────────────────────────────────────────────────────────
export const inviteFixtures: GroupInvite[] = [
  { id: 'invite-lille', groupId: 'group-lille', code: 'FC-LILLE', expiresAt: '2026-06-01T10:00:00.000Z', maxUses: 12, currentUses: 4, createdAt: '2026-04-02T10:00:00.000Z' },
  { id: 'invite-paris', groupId: 'group-paris', code: 'FC-PARIS', expiresAt: '2026-06-10T08:00:00.000Z', maxUses: 8, currentUses: 3, createdAt: '2026-04-10T08:00:00.000Z' },
  { id: 'invite-lyon', groupId: 'group-lyon', code: 'FC-LYON', expiresAt: '2026-06-20T09:00:00.000Z', maxUses: 10, currentUses: 2, createdAt: '2026-04-20T09:00:00.000Z' },
];

// ── Restaurants ──────────────────────────────────────────────────────────
export const restaurantFixtures: Restaurant[] = [
  { id: 'rest-kebab', name: 'Lille Kebab Express', description: 'Rapide et généreux.', address: '1 Rue Nationale, Lille', latitude: '50.632000', longitude: '3.060000', cuisineTags: ['fast-food', 'kebab'], photoUrls: [], phone: null, website: null, createdBy: 'user-alice', createdAt: '2026-04-03T10:00:00.000Z', distanceMeters: 250 },
  { id: 'rest-bistrot', name: 'Le Petit Bistrot Lillois', description: 'Croisement de tradition et convivialité.', address: '5 Rue de la Monnaie, Lille', latitude: '50.628000', longitude: '3.055000', cuisineTags: ['french', 'bistro'], photoUrls: [], phone: null, website: null, createdBy: 'user-alice', createdAt: '2026-04-03T10:05:00.000Z', distanceMeters: 380 },
  { id: 'rest-marcel', name: 'Chez Marcel Sandwich', description: 'Sandwichs sans prétention.', address: '8 Rue des Manneliers, Lille', latitude: '50.630000', longitude: '3.058000', cuisineTags: ['fast-food', 'sandwich'], photoUrls: [], phone: null, website: null, createdBy: 'user-ben', createdAt: '2026-04-04T10:00:00.000Z', distanceMeters: 450, rating: { average: 1.33, count: 3 } },
  { id: 'rest-table', name: 'La Table de Lille', description: 'Gastronomie fine du Nord.', address: '2 Rue Royale, Lille', latitude: '50.631000', longitude: '3.054000', cuisineTags: ['french', 'fine-dining'], photoUrls: [], phone: null, website: null, createdBy: 'user-alice', createdAt: '2026-04-03T10:10:00.000Z', distanceMeters: 520 },
  { id: 'rest-vieux', name: 'Au Vieux Lille Gastronomique', description: 'Le meilleur du terroir.', address: '15 Rue de la Grande Chaussée, Lille', latitude: '50.645000', longitude: '3.070000', cuisineTags: ['french', 'gastronomic'], photoUrls: [], phone: null, website: null, createdBy: 'user-chloe', createdAt: '2026-04-03T10:15:00.000Z', distanceMeters: 1800, rating: { average: 5.0, count: 2 } },
  { id: 'rest-quick-lille', name: 'Quick Burger Lille Sud', description: 'Le classique rapide.', address: '20 Rue de Cambrai, Lille', latitude: '50.610000', longitude: '3.040000', cuisineTags: ['fast-food', 'burger'], photoUrls: [], phone: null, website: null, createdBy: 'user-david', createdAt: '2026-04-05T10:00:00.000Z', distanceMeters: 2200 },
  { id: 'rest-frites', name: 'Frites Factory', description: 'Frites belges artisanales.', address: '3 Rue des Archives, Lille', latitude: '50.633000', longitude: '3.062000', cuisineTags: ['belgian', 'fast-food'], photoUrls: [], phone: null, website: null, createdBy: 'user-ben', createdAt: '2026-04-04T10:05:00.000Z', distanceMeters: 300 },
  { id: 'rest-sakura', name: 'Sakura Sushi Paris', description: 'Japonais authentique.', address: '6 Rue Sainte-Croix, Paris', latitude: '48.860000', longitude: '2.340000', cuisineTags: ['japanese', 'sushi'], photoUrls: [], phone: null, website: null, createdBy: 'user-chloe', createdAt: '2026-04-11T10:00:00.000Z', distanceMeters: 350 },
  { id: 'rest-trattoria', name: 'Trattoria Roma', description: 'Comme en Italie.', address: '12 Rue de Rivoli, Paris', latitude: '48.855000', longitude: '2.360000', cuisineTags: ['italian', 'pasta'], photoUrls: [], phone: null, website: null, createdBy: 'user-david', createdAt: '2026-04-11T10:05:00.000Z', distanceMeters: 800, rating: { average: 4.0, count: 2 } },
  { id: 'rest-burger', name: 'Le Burger Atelier', description: 'Burgers gourmets.', address: '30 Rue du Temple, Paris', latitude: '48.850000', longitude: '3.245000', cuisineTags: ['american', 'burger'], photoUrls: [], phone: null, website: null, createdBy: 'user-emma', createdAt: '2026-04-11T10:10:00.000Z', distanceMeters: 1200 },
  { id: 'rest-ambroisie', name: "L'Ambroisie", description: 'Étoilé et mémorable.', address: '9 Place des Vosges, Paris', latitude: '48.855000', longitude: '2.358000', cuisineTags: ['french', 'fine-dining'], photoUrls: [], phone: null, website: null, createdBy: 'user-chloe', createdAt: '2026-04-11T10:15:00.000Z', distanceMeters: 600 },
  { id: 'rest-opera', name: "Quick L'Opéra", description: 'Fast-food Opéra.', address: '1 Boulevard des Capucines, Paris', latitude: '48.870000', longitude: '2.332000', cuisineTags: ['fast-food', 'burger'], photoUrls: [], phone: null, website: null, createdBy: 'user-david', createdAt: '2026-04-12T10:00:00.000Z', distanceMeters: 2500 },
];

// ── Vote Sessions (all statuses) ─────────────────────────────────────────
export const sessionFixtures: VoteSession[] = [
  {
    id: 'session-monday', groupId: 'group-lille', name: 'Monday Team Lunch', description: 'Vote before 11:45.',
    status: 'completed', voteType: 'approval', createdBy: 'user-alice',
    deadline: '2026-05-14T11:45:00.000Z',
    startAddress: 'Place du Général de Gaulle, Lille', startLatitude: '50.629200', startLongitude: '3.057300',
    searchRadiusMeters: 2000, budgetMax: '18.00',
    selectedRestaurantId: 'rest-marcel', completedAt: '2026-05-14T12:00:00.000Z',
    createdAt: '2026-05-14T09:00:00.000Z',
  },
  {
    id: 'session-friday', groupId: 'group-lille', name: 'Friday Dinner', description: 'Decide where to eat tonight.',
    status: 'voting', voteType: 'approval', createdBy: 'user-ben',
    deadline: '2026-05-20T18:00:00.000Z',
    startAddress: 'Place du Général de Gaulle, Lille', startLatitude: '50.629200', startLongitude: '3.057300',
    searchRadiusMeters: 2000, budgetMax: '20.00',
    selectedRestaurantId: null, completedAt: null,
    createdAt: '2026-05-19T10:00:00.000Z',
  },
  {
    id: 'session-weekend', groupId: 'group-paris', name: 'Weekend Brunch', description: 'Parisian brunch spot.',
    status: 'active', voteType: 'approval', createdBy: 'user-chloe',
    deadline: '2026-05-25T11:00:00.000Z',
    startAddress: '10 Rue de Rivoli, Paris', startLatitude: '48.856600', startLongitude: '2.352200',
    searchRadiusMeters: 3000, budgetMax: '35.00',
    selectedRestaurantId: null, completedAt: null,
    createdAt: '2026-05-20T08:00:00.000Z',
  },
  {
    id: 'session-impromptu', groupId: 'group-paris', name: 'Impromptu Snack', description: 'Quick grab.',
    status: 'draft', voteType: 'approval', createdBy: 'user-david',
    deadline: null,
    startAddress: null, startLatitude: null, startLongitude: null,
    searchRadiusMeters: null, budgetMax: null,
    selectedRestaurantId: null, completedAt: null,
    createdAt: '2026-05-21T09:00:00.000Z',
  },
  {
    id: 'session-lyon', groupId: 'group-lyon', name: 'Lyon Celebration', description: "Fête à Lyon.",
    status: 'completed', voteType: 'approval', createdBy: 'user-frank',
    deadline: '2026-05-10T20:00:00.000Z',
    startAddress: 'Place Bellecour, Lyon', startLatitude: '45.764000', startLongitude: '4.835700',
    searchRadiusMeters: 1500, budgetMax: '25.00',
    selectedRestaurantId: 'rest-trattoria', completedAt: '2026-05-10T21:00:00.000Z',
    createdAt: '2026-05-10T18:00:00.000Z',
  },
  {
    id: 'session-sunday', groupId: 'group-lille', name: 'Sunday Gourmet', description: 'Le bon dimanche.',
    status: 'completed', voteType: 'approval', createdBy: 'user-alice',
    deadline: '2026-05-17T12:00:00.000Z',
    startAddress: 'Place du Général de Gaulle, Lille', startLatitude: '50.629200', startLongitude: '3.057300',
    searchRadiusMeters: 2000, budgetMax: '20.00',
    selectedRestaurantId: 'rest-vieux', completedAt: '2026-05-17T12:30:00.000Z',
    createdAt: '2026-05-17T10:00:00.000Z',
  },
  {
    id: 'session-cancelled', groupId: 'group-lille', name: 'Cancelled Outing', description: 'Pas cette fois.',
    status: 'cancelled', voteType: 'approval', createdBy: 'user-ben',
    deadline: '2026-05-16T12:00:00.000Z',
    startAddress: 'Place du Général de Gaulle, Lille', startLatitude: '50.629200', startLongitude: '3.057300',
    searchRadiusMeters: 2000, budgetMax: '20.00',
    selectedRestaurantId: null, completedAt: null,
    createdAt: '2026-05-15T10:00:00.000Z',
  },
];

// ── Session Candidates ───────────────────────────────────────────────────
export const candidateFixtures: SessionCandidate[] = [
  { id: 'cand-mon01', sessionId: 'session-monday', restaurantId: 'rest-kebab', addedBy: 'user-alice', createdAt: '2026-05-14T09:05:00.000Z', restaurant: restaurantFixtures[0] },
  { id: 'cand-mon02', sessionId: 'session-monday', restaurantId: 'rest-marcel', addedBy: 'user-ben', createdAt: '2026-05-14T09:10:00.000Z', restaurant: restaurantFixtures[2] },
  { id: 'cand-mon03', sessionId: 'session-monday', restaurantId: 'rest-frites', addedBy: 'user-chloe', createdAt: '2026-05-14T09:15:00.000Z', restaurant: restaurantFixtures[5] },
  { id: 'cand-mon04', sessionId: 'session-monday', restaurantId: 'rest-bistrot', addedBy: 'user-david', createdAt: '2026-05-14T09:20:00.000Z', restaurant: restaurantFixtures[1] },
  { id: 'cand-fri01', sessionId: 'session-friday', restaurantId: 'rest-bistrot', addedBy: 'user-alice', createdAt: '2026-05-19T10:05:00.000Z', restaurant: restaurantFixtures[1] },
  { id: 'cand-fri02', sessionId: 'session-friday', restaurantId: 'rest-kebab', addedBy: 'user-ben', createdAt: '2026-05-19T10:10:00.000Z', restaurant: restaurantFixtures[0] },
  { id: 'cand-fri03', sessionId: 'session-friday', restaurantId: 'rest-vieux', addedBy: 'user-chloe', createdAt: '2026-05-19T10:15:00.000Z', restaurant: restaurantFixtures[4] },
  { id: 'cand-fri04', sessionId: 'session-friday', restaurantId: 'rest-quick-lille', addedBy: 'user-david', createdAt: '2026-05-19T10:20:00.000Z', restaurant: restaurantFixtures[5] },
  { id: 'cand-fri05', sessionId: 'session-friday', restaurantId: 'rest-table', addedBy: 'user-alice', createdAt: '2026-05-19T10:25:00.000Z', restaurant: restaurantFixtures[3] },
  { id: 'cand-wk01', sessionId: 'session-weekend', restaurantId: 'rest-sakura', addedBy: 'user-chloe', createdAt: '2026-05-20T08:05:00.000Z', restaurant: restaurantFixtures[7] },
  { id: 'cand-wk02', sessionId: 'session-weekend', restaurantId: 'rest-trattoria', addedBy: 'user-david', createdAt: '2026-05-20T08:10:00.000Z', restaurant: restaurantFixtures[8] },
  { id: 'cand-wk03', sessionId: 'session-weekend', restaurantId: 'rest-burger', addedBy: 'user-emma', createdAt: '2026-05-20T08:15:00.000Z', restaurant: restaurantFixtures[9] },
  { id: 'cand-wk04', sessionId: 'session-weekend', restaurantId: 'rest-opera', addedBy: 'user-chloe', createdAt: '2026-05-20T08:20:00.000Z', restaurant: restaurantFixtures[11] },
  { id: 'cand-lyon01', sessionId: 'session-lyon', restaurantId: 'rest-trattoria', addedBy: 'user-frank', createdAt: '2026-05-10T18:05:00.000Z', restaurant: restaurantFixtures[8] },
  { id: 'cand-lyon02', sessionId: 'session-lyon', restaurantId: 'rest-sakura', addedBy: 'user-alice', createdAt: '2026-05-10T18:10:00.000Z', restaurant: restaurantFixtures[7] },
  { id: 'cand-lyon03', sessionId: 'session-lyon', restaurantId: 'rest-ambroisie', addedBy: 'user-frank', createdAt: '2026-05-10T18:15:00.000Z', restaurant: restaurantFixtures[10] },
  { id: 'cand-sun01', sessionId: 'session-sunday', restaurantId: 'rest-vieux', addedBy: 'user-alice', createdAt: '2026-05-17T10:05:00.000Z', restaurant: restaurantFixtures[4] },
  { id: 'cand-sun02', sessionId: 'session-sunday', restaurantId: 'rest-table', addedBy: 'user-ben', createdAt: '2026-05-17T10:10:00.000Z', restaurant: restaurantFixtures[3] },
  { id: 'cand-sun03', sessionId: 'session-sunday', restaurantId: 'rest-bistrot', addedBy: 'user-chloe', createdAt: '2026-05-17T10:15:00.000Z', restaurant: restaurantFixtures[1] },
];

// ── Votes ─────────────────────────────────────────────────────────────────
export const voteFixtures: Vote[] = [
  { id: 'vote-mon01', sessionId: 'session-monday', candidateId: 'cand-mon02', userId: 'user-alice', value: 1, createdAt: '2026-05-14T10:00:00.000Z' },
  { id: 'vote-mon02', sessionId: 'session-monday', candidateId: 'cand-mon02', userId: 'user-ben', value: 1, createdAt: '2026-05-14T10:01:00.000Z' },
  { id: 'vote-mon03', sessionId: 'session-monday', candidateId: 'cand-mon02', userId: 'user-chloe', value: 1, createdAt: '2026-05-14T10:02:00.000Z' },
  { id: 'vote-mon04', sessionId: 'session-monday', candidateId: 'cand-mon02', userId: 'user-david', value: 1, createdAt: '2026-05-14T10:03:00.000Z' },
  { id: 'vote-mon05', sessionId: 'session-monday', candidateId: 'cand-mon01', userId: 'user-ben', value: 1, createdAt: '2026-05-14T10:04:00.000Z' },
  { id: 'vote-mon06', sessionId: 'session-monday', candidateId: 'cand-mon01', userId: 'user-david', value: 1, createdAt: '2026-05-14T10:05:00.000Z' },
  { id: 'vote-fri01', sessionId: 'session-friday', candidateId: 'cand-fri01', userId: 'user-alice', value: 1, createdAt: '2026-05-19T11:00:00.000Z' },
  { id: 'vote-fri02', sessionId: 'session-friday', candidateId: 'cand-fri02', userId: 'user-ben', value: 1, createdAt: '2026-05-19T11:01:00.000Z' },
  { id: 'vote-fri03', sessionId: 'session-friday', candidateId: 'cand-fri03', userId: 'user-chloe', value: 1, createdAt: '2026-05-19T11:02:00.000Z' },
  { id: 'vote-fri04', sessionId: 'session-friday', candidateId: 'cand-fri04', userId: 'user-david', value: 1, createdAt: '2026-05-19T11:03:00.000Z' },
  { id: 'vote-fri05', sessionId: 'session-friday', candidateId: 'cand-fri05', userId: 'user-alice', value: 1, createdAt: '2026-05-19T11:04:00.000Z' },
  { id: 'vote-fri06', sessionId: 'session-friday', candidateId: 'cand-fri01', userId: 'user-chloe', value: 1, createdAt: '2026-05-19T11:05:00.000Z' },
];

// ── Vote Results (for completed sessions) ────────────────────────────────
export const voteResultFixtures: VoteResult[] = [
  { candidateId: 'cand-mon02', restaurantId: 'rest-marcel', restaurantName: 'Chez Marcel Sandwich', votes: 4, creatorApproved: true },
  { candidateId: 'cand-mon01', restaurantId: 'rest-kebab', restaurantName: 'Lille Kebab Express', votes: 2, creatorApproved: true },
  { candidateId: 'cand-mon03', restaurantId: 'rest-frites', restaurantName: 'Frites Factory', votes: 0, creatorApproved: false },
  { candidateId: 'cand-mon04', restaurantId: 'rest-bistrot', restaurantName: 'Le Petit Bistrot Lillois', votes: 0, creatorApproved: false },
];

// ── Food Calls ──────────────────────────────────────────────────────────
export const callFixtures: FoodCall[] = [
  { id: 'call-mon01', sessionId: 'session-monday', restaurantId: 'rest-marcel', userId: 'user-alice', pitch: 'Fiable, rapide, et tout le monde y trouve son option.', createdAt: '2026-05-14T09:12:00.000Z', restaurant: restaurantFixtures[2], group: groupFixtures[0] },
  { id: 'call-mon02', sessionId: 'session-monday', restaurantId: 'rest-kebab', userId: 'user-ben', pitch: 'Le meilleur rapport qualité-prix du quartier.', createdAt: '2026-05-14T09:15:00.000Z', restaurant: restaurantFixtures[0], group: groupFixtures[0] },
  { id: 'call-mon03', sessionId: 'session-monday', restaurantId: 'rest-bistrot', userId: 'user-chloe', pitch: 'Un bistrot comme on les aime.', createdAt: '2026-05-14T09:18:00.000Z', restaurant: restaurantFixtures[1], group: groupFixtures[0] },
  { id: 'call-lyon01', sessionId: 'session-lyon', restaurantId: 'rest-trattoria', userId: 'user-frank', pitch: "L'Italie à Lyon.", createdAt: '2026-05-10T18:30:00.000Z', restaurant: restaurantFixtures[8], group: groupFixtures[2] },
  { id: 'call-lyon02', sessionId: 'session-lyon', restaurantId: 'rest-sakura', userId: 'user-alice', pitch: 'Sushi de qualité au centre.', createdAt: '2026-05-10T18:35:00.000Z', restaurant: restaurantFixtures[7], group: groupFixtures[2] },
];

// ── Call Feedback ────────────────────────────────────────────────────────
export const feedbackFixtures: CallFeedback[] = [
  { id: 'fb-mon01', callId: 'call-mon01', userId: 'user-alice', rating: 5, comment: 'Très bon call.', createdAt: '2026-05-14T13:00:00.000Z' },
  { id: 'fb-mon02', callId: 'call-mon02', userId: 'user-ben', rating: 4, comment: 'Correct.', createdAt: '2026-05-14T13:05:00.000Z' },
  { id: 'fb-mon03', callId: 'call-mon03', userId: 'user-chloe', rating: 3, comment: 'Bonne ambiance.', createdAt: '2026-05-14T13:10:00.000Z' },
  { id: 'fb-lyon01', callId: 'call-lyon01', userId: 'user-frank', rating: 5, comment: 'Excellent!', createdAt: '2026-05-10T22:00:00.000Z' },
  { id: 'fb-lyon02', callId: 'call-lyon02', userId: 'user-alice', rating: 4, comment: 'Bons sushis.', createdAt: '2026-05-10T22:05:00.000Z' },
  { id: 'fb-lyon03', callId: 'call-lyon01', userId: 'user-alice', rating: 4, comment: null, createdAt: '2026-05-10T22:10:00.000Z' },
];

// ── Reviews ──────────────────────────────────────────────────────────────
export const reviewFixtures: RestaurantReview[] = [
  { id: 'rev-01', restaurantId: 'rest-marcel', userId: 'user-alice', sessionId: 'session-monday', rating: 2, comment: 'Déçu, la qualité a baissé.', createdAt: '2026-05-14T14:00:00.000Z', updatedAt: '2026-05-14T14:00:00.000Z', deletedAt: null },
  { id: 'rev-02', restaurantId: 'rest-marcel', userId: 'user-ben', sessionId: 'session-monday', rating: 1, comment: 'Sandwich sec, pas bon du tout.', createdAt: '2026-05-14T14:05:00.000Z', updatedAt: '2026-05-14T14:05:00.000Z', deletedAt: null },
  { id: 'rev-03', restaurantId: 'rest-marcel', userId: 'user-chloe', sessionId: 'session-monday', rating: 1, comment: 'À éviter.', createdAt: '2026-05-14T14:10:00.000Z', updatedAt: '2026-05-14T14:10:00.000Z', deletedAt: null },
  { id: 'rev-04', restaurantId: 'rest-vieux', userId: 'user-frank', sessionId: 'session-sunday', rating: 5, comment: 'Exceptionnel, comme toujours.', createdAt: '2026-05-17T13:00:00.000Z', updatedAt: '2026-05-17T13:00:00.000Z', deletedAt: null },
  { id: 'rev-05', restaurantId: 'rest-vieux', userId: 'user-alice', sessionId: 'session-sunday', rating: 5, comment: 'Le meilleur du quartier.', createdAt: '2026-05-17T13:05:00.000Z', updatedAt: '2026-05-17T13:05:00.000Z', deletedAt: null },
  { id: 'rev-06', restaurantId: 'rest-trattoria', userId: 'user-frank', sessionId: 'session-lyon', rating: 4, comment: 'Bonne pasta.', createdAt: '2026-05-10T22:30:00.000Z', updatedAt: '2026-05-10T22:30:00.000Z', deletedAt: null },
  { id: 'rev-07', restaurantId: 'rest-trattoria', userId: 'user-alice', sessionId: 'session-lyon', rating: 4, comment: 'Ambiance italienne réussie.', createdAt: '2026-05-10T22:35:00.000Z', updatedAt: '2026-05-10T22:35:00.000Z', deletedAt: null },
];

// ── External Restaurants ─────────────────────────────────────────────────
export const externalRestaurantFixtures: ExternalRestaurant[] = [
  { provider: 'google', providerPlaceId: 'g-place-1', name: 'Le Comptoir du Panthéon', address: '8 Place du Panthéon, Paris', latitude: 48.8462, longitude: 2.3464, phone: '+33 1 23 45 67 89', website: 'https://example.com', cuisineTags: ['french', 'bistro'], photoUrls: [], distanceMeters: 350, durationSeconds: 260 },
  { provider: 'google', providerPlaceId: 'g-place-2', name: 'Sushi Zen Paris', address: '15 Rue Mouffetard, Paris', latitude: 48.8430, longitude: 2.3490, phone: null, website: null, cuisineTags: ['japanese', 'sushi'], photoUrls: [], distanceMeters: 600, durationSeconds: 480 },
];

// ── External Restaurant Import ──────────────────────────────────────────
export const importResponseFixture: ExternalRestaurantImportResponse = {
  restaurant: restaurantFixtures[0],
  source: {
    id: 'src-1', restaurantId: 'rest-kebab', provider: 'google', providerPlaceId: 'g-place-1',
    name: 'Lille Kebab Express', address: '1 Rue Nationale, Lille', latitude: '50.632000', longitude: '3.060000',
    sourcePayload: { place_id: 'g-place-1' }, importedAt: '2026-05-18T10:00:00.000Z',
  },
  imported: true,
  candidate: candidateFixtures[0],
  matchedBy: 'provider-source',
  restaurantCreated: false,
  sourceLinked: true,
  sourceAction: 'reused',
  candidateAdded: true,
  transactional: true,
};

// ── Recommendations ─────────────────────────────────────────────────────
export const recommendationFixtures: RecommendationItem[] = [
  {
    restaurantId: 'rest-vieux', restaurant: { id: 'rest-vieux', name: 'Au Vieux Lille Gastronomique', address: '15 Rue de la Grande Chaussée, Lille', latitude: 50.645, longitude: 3.070 }, rank: 1, score: 0.89,
    explanation: {
      summary: 'Top-rated nearby restaurant with excellent reviews.',
      components: [
        { key: 'restaurantScore', score: 5.0, weight: 0.5, contribution: 0.50, reason: '5.0 average rating from 2 reviews' },
        { key: 'distance', score: 0.7, weight: 0.3, contribution: 0.21, reason: '1.8 km from group start point' },
        { key: 'budget', score: 0.0, weight: 0.15, contribution: 0.00, reason: '€38 exceeds €20 budget' },
        { key: 'history', score: 0.9, weight: 0.05, contribution: 0.05, reason: 'Previously selected and highly rated' },
      ],
    },
  },
  {
    restaurantId: 'rest-bistrot', restaurant: { id: 'rest-bistrot', name: 'Le Petit Bistrot Lillois', address: '5 Rue de la Monnaie, Lille', latitude: 50.628, longitude: 3.055 }, rank: 2, score: 0.72,
    explanation: {
      summary: 'Well-rated French bistro within budget.',
      components: [
        { key: 'restaurantScore', score: 0.0, weight: 0.5, contribution: 0.00, reason: 'No reviews yet' },
        { key: 'distance', score: 0.95, weight: 0.3, contribution: 0.29, reason: '380 m from group start point' },
        { key: 'budget', score: 0.7, weight: 0.15, contribution: 0.11, reason: '€14 within €20 budget' },
        { key: 'history', score: 0.7, weight: 0.05, contribution: 0.04, reason: 'Candidate in past sessions' },
      ],
    },
  },
];

// ── Geocode / Route ──────────────────────────────────────────────────────
export const geocodeFixture: GeocodeResult = { lat: 48.8566, lng: 2.3522, formattedAddress: '10 Rue de Rivoli, Paris' };
export const routeFixture: GeoRouteResult = { distance: 2500, duration: 900 };

// ── Pagination Helpers ───────────────────────────────────────────────────
export function paginate<T>(items: T[], cursor?: string, limit = 20): CursorPage<T> {
  const effectiveLimit = Math.min(Math.max(limit, 1), 50);
  const offset = cursor ? parseInt(atob(cursor), 10) : 0;
  const page = items.slice(offset, offset + effectiveLimit + 1);
  const hasMore = page.length > effectiveLimit;
  const data = hasMore ? page.slice(0, effectiveLimit) : page;
  const nextOffset = hasMore ? offset + effectiveLimit : null;
  return { data, meta: { nextCursor: nextOffset !== null ? btoa(String(nextOffset)) : null } };
}

export const emptyPage = <T>(): CursorPage<T> => ({ data: [], meta: { nextCursor: null } });

// ── Scenario Error Helpers ──────────────────────────────────────────────
export const apiErrors = {
  validation: (details?: Record<string, unknown>): ApiErrorBody => ({ statusCode: 400, message: 'Validation failed', error: 'Bad Request', details }),
  unauthorized: (): ApiErrorBody => ({ statusCode: 401, message: 'Authentication required', error: 'Unauthorized' }),
  forbidden: (msg = 'Insufficient permissions'): ApiErrorBody => ({ statusCode: 403, message: msg, error: 'Forbidden' }),
  notFound: (resource = 'Resource'): ApiErrorBody => ({ statusCode: 404, message: `${resource} not found`, error: 'Not Found' }),
  conflict: (msg = 'Resource already exists'): ApiErrorBody => ({ statusCode: 409, message: msg, error: 'Conflict' }),
  rateLimit: (): ApiErrorBody => ({ statusCode: 429, message: 'Too many requests', error: 'Too Many Requests' }),
  providerFailure: (provider = 'google'): ApiErrorBody => ({ statusCode: 503, message: `External provider ${provider} unavailable`, error: 'Service Unavailable', details: { code: 'EXTERNAL_PROVIDER_TIMEOUT' } }),
  providerFailure502: (provider = 'google'): ApiErrorBody => ({ statusCode: 502, message: `External provider ${provider} unavailable`, error: 'Bad Gateway', details: { code: 'EXTERNAL_PROVIDER_TIMEOUT' } }),
  providerFailure504: (provider = 'google'): ApiErrorBody => ({ statusCode: 504, message: `External provider ${provider} unavailable`, error: 'Gateway Timeout', details: { code: 'EXTERNAL_PROVIDER_TIMEOUT' } }),
};