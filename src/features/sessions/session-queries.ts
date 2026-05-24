import type { SessionStatus } from '@/types/api';
import {
  useGroupSessionsQuery,
  useSessionQuery,
  useCreateSessionMutation,
  useActivateSessionMutation,
  useStartVotingMutation,
  useSelectRestaurantMutation,
  useCompleteSessionMutation,
  useCancelSessionMutation,
  useSessionCandidatesQuery,
  useSessionVotesQuery,
  useSessionResultsQuery,
  useCastVoteMutation,
  useDeleteVoteMutation,
  useSessionCallsQuery,
  useSessionRecommendationsQuery,
  useCreateCallMutation,
  useDeleteCallMutation,
} from '@/features/server-state';

export {
  useGroupSessionsQuery as useSessionsQuery,
  useSessionQuery,
  useCreateSessionMutation,
  useActivateSessionMutation,
  useStartVotingMutation,
  useSelectRestaurantMutation,
  useCompleteSessionMutation,
  useCancelSessionMutation,
  useSessionCandidatesQuery,
  useSessionVotesQuery,
  useSessionResultsQuery,
  useCastVoteMutation,
  useDeleteVoteMutation,
  useSessionCallsQuery,
  useSessionRecommendationsQuery,
  useCreateCallMutation,
  useDeleteCallMutation,
};

const STATUS_LABELS: Record<SessionStatus, string> = {
  draft: 'Brouillon',
  active: 'Active',
  voting: 'En cours de vote',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export function sessionStatusLabel(status: SessionStatus): string {
  return STATUS_LABELS[status];
}

export function sessionStatusTone(status: SessionStatus): string {
  const tones: Record<SessionStatus, string> = {
    draft: 'bg-soft text-muted',
    active: 'bg-primary/10 text-primary',
    voting: 'bg-secondary/10 text-secondary',
    completed: 'bg-success/10 text-success',
    cancelled: 'bg-danger/10 text-danger',
  };
  return tones[status];
}

export function canTransitionSession(status: SessionStatus): SessionStatus[] {
  const transitions: Record<SessionStatus, SessionStatus[]> = {
    draft: ['active', 'voting', 'cancelled'],
    active: ['voting', 'cancelled'],
    voting: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };
  return transitions[status];
}
