import type { GroupRole, SessionStatus, VoteType } from '@/types/api';

export const ROUTES = {
  login: '/connexion',
  register: '/inscription',
  forgotPassword: '/mot-de-passe-oublie',
  onboarding: '/onboarding',
  discover: '/decouvrir',
  groups: '/groupes',
  groupDetail: '/groupes/:id',
  groupSessions: '/groupes/:groupId/sessions',
  sessionDetail: '/sessions/:id',
  reviews: '/avis',
  calls: '/mes-calls',
  profile: '/profil',
  settings: '/parametres',
  restaurantDetail: '/restaurants/:id',
} as const;

export const BREAKPOINTS = { md: 680, lg: 1180 } as const;

export const API_ROUTES = {
  // Auth
  login: '/auth/login',
  register: '/auth/register',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  changePassword: '/auth/change-password',

  // Users
  me: '/users/me',
  avatar: '/users/me/avatar',
  avatarDelete: '/users/me/avatar',

  // Groups
  groups: '/groups',
  groupDetail: '/groups/:id',
  groupUpdate: '/groups/:id',
  groupDelete: '/groups/:id',

  // Group members
  groupMembers: '/groups/:id/members',
  groupMemberRole: '/groups/:id/members/:userId/role',
  groupMemberRemove: '/groups/:id/members/:userId',

  // Group invites
  groupInvites: '/groups/:id/invites',
  groupJoin: '/groups/join',

  // Group sessions
  groupSessions: '/groups/:id/sessions',

  // Group recommendations
  groupRecommendations: '/groups/:id/recommendations',

  // Restaurants
  restaurants: '/restaurants',
  restaurantDetail: '/restaurants/:id',
  restaurantsNearby: '/restaurants/nearby',
  restaurantsSearch: '/restaurants/search',

  // Restaurant reviews
  restaurantReviews: '/restaurants/:id/reviews',
  reviewDetail: '/reviews/:id',
  reviewUpdate: '/reviews/:id',
  reviewDelete: '/reviews/:id',

  // External restaurants
  externalRestaurantsSearch: '/external-restaurants/search',
  externalRestaurantsImport: '/external-restaurants/import',

  // Geo
  geoGeocode: '/geo/geocode',
  geoRoute: '/geo/route',

  // Sessions
  sessions: '/sessions',
  sessionDetail: '/sessions/:id',
  sessionUpdate: '/sessions/:id',
  sessionActivate: '/sessions/:id/activate',
  sessionStartVoting: '/sessions/:id/start-voting',
  sessionSelectRestaurant: '/sessions/:id/select-restaurant',
  sessionComplete: '/sessions/:id/complete',
  sessionCancel: '/sessions/:id/cancel',

  // Session candidates
  sessionCandidates: '/sessions/:id/candidates',
  sessionCandidateRemove: '/sessions/:id/candidates/:candidateId',

  // Session votes
  sessionVotes: '/sessions/:id/votes',
  sessionVoteDetail: '/sessions/:id/votes/:voteId',
  sessionResults: '/sessions/:id/results',

  // Session calls
  sessionCalls: '/sessions/:id/calls',

  // Calls
  callDetail: '/calls/:id',

  // Call feedback
  callFeedback: '/calls/:id/feedback',

  // Session recommendations
  sessionRecommendations: '/sessions/:id/recommendations',
} as const;

export const NAV_ITEMS = [
  { label: 'Découvrir', path: ROUTES.discover },
  { label: 'Groupes', path: ROUTES.groups },
  { label: 'Avis', path: ROUTES.reviews },
  { label: 'Mes calls', path: ROUTES.calls },
] as const;

export const USER_MENU_ITEMS = [
  { label: 'Profil', path: ROUTES.profile },
  { label: 'Paramètres', path: ROUTES.settings },
] as const;

export const SESSION_STATUSES: SessionStatus[] = ['draft', 'active', 'voting', 'completed', 'cancelled'];
export const GROUP_ROLES: GroupRole[] = ['owner', 'admin', 'member'];
export const VOTE_TYPES: VoteType[] = ['approval', 'ranking', 'stars'];

export const API_ERROR_CODES: Record<number, string> = {
  400: 'Requête invalide.',
  401: 'Connexion requise.',
  403: 'Action non autorisée.',
  404: 'Ressource introuvable.',
  409: 'Conflit avec une donnée existante.',
  422: 'Données invalides.',
  429: 'Trop de requêtes. Réessaie plus tard.',
  500: 'Erreur serveur.',
  502: 'Erreur de passerelle.',
  503: 'Service indisponible.',
  504: 'Délai dépassé.',
};

export type ApiRouteParams = Record<string, string | number>;
export type ApiRouteQuery = Record<string, string | number | boolean | undefined | null>;

export function buildApiRoute(
  template: string,
  params?: ApiRouteParams,
  query?: ApiRouteQuery,
): string {
  let path = template;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      path = path.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }
  if (query) {
    const entries = Object.entries(query).filter(
      ([, v]) => v !== undefined && v !== null,
    );
    if (entries.length > 0) {
      const qs = entries
        .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
        .join('&');
      path = `${path}?${qs}`;
    }
  }
  return path;
}