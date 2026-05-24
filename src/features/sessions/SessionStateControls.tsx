import { useState } from 'react';
import type { SessionStatus, SessionCandidate } from '@/types/api';
import {
  useActivateSessionMutation,
  useStartVotingMutation,
  useSelectRestaurantMutation,
  useCompleteSessionMutation,
  useCancelSessionMutation,
  canTransitionSession,
} from './session-queries';

interface Props {
  sessionId: string;
  status: SessionStatus;
  createdBy: string;
  currentUserId?: string;
  selectedRestaurantId?: string | null;
  candidates?: SessionCandidate[];
}

export function SessionStateControls({ sessionId, status, createdBy, currentUserId, selectedRestaurantId, candidates }: Props) {
  const isCreator = currentUserId === createdBy;
  const allowedTransitions = canTransitionSession(status);

  const activateMutation = useActivateSessionMutation();
  const startVotingMutation = useStartVotingMutation();
  const selectMutation = useSelectRestaurantMutation();
  const completeMutation = useCompleteSessionMutation();
  const cancelMutation = useCancelSessionMutation();

  const [selectedCandidateId, setSelectedCandidateId] = useState('');

  if (!isCreator || allowedTransitions.length === 0) return null;

  const hasCandidates = candidates && candidates.length > 0;
  const hasSelection = !!selectedRestaurantId;

  return (
    <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
      <h2 className="text-lg font-bold text-fg">Actions créateur</h2>

      <div className="flex flex-wrap gap-2">
        {allowedTransitions.includes('active') && (
          <button
            type="button"
            disabled={activateMutation.isPending}
            className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            onClick={() => activateMutation.mutate(sessionId)}
          >
            {activateMutation.isPending ? 'Activation...' : 'Activer'}
          </button>
        )}

        {allowedTransitions.includes('voting') && (
          <button
            type="button"
            disabled={startVotingMutation.isPending}
            className="rounded-radius bg-secondary px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            onClick={() => startVotingMutation.mutate(sessionId)}
          >
            {startVotingMutation.isPending ? 'Lancement...' : 'Lancer le vote'}
          </button>
        )}

        {status === 'voting' && hasCandidates && (
          <div className="flex items-center gap-2">
            <div className="grid gap-1">
              <label htmlFor="select-restaurant" className="text-xs font-semibold text-fg">
                Restaurant
              </label>
              <select
                id="select-restaurant"
                className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg"
                value={selectedCandidateId}
                onChange={(e) => setSelectedCandidateId(e.target.value)}
              >
                <option value="">-- Choisir --</option>
                {candidates!.map((c) => (
                  <option key={c.id} value={c.restaurantId}>
                    {c.restaurant?.name ?? c.restaurantId}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              disabled={!selectedCandidateId || selectMutation.isPending}
              className="rounded-radius bg-primary px-3 py-2 text-xs font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
              onClick={() => selectMutation.mutate({ id: sessionId, restaurantId: selectedCandidateId })}
            >
              {selectMutation.isPending ? 'Selection...' : 'Selectionner'}
            </button>
          </div>
        )}

        {allowedTransitions.includes('completed') && (
          <button
            type="button"
            disabled={!hasSelection || completeMutation.isPending}
            className="rounded-radius bg-success px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            onClick={() => completeMutation.mutate(sessionId)}
          >
            {completeMutation.isPending ? 'Finalisation...' : 'Terminer'}
          </button>
        )}

        {allowedTransitions.includes('cancelled') && (
          <button
            type="button"
            disabled={cancelMutation.isPending}
            className="rounded-radius bg-danger px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            onClick={() => cancelMutation.mutate(sessionId)}
          >
            {cancelMutation.isPending ? 'Annulation...' : 'Annuler'}
          </button>
        )}
      </div>

      {activateMutation.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">Erreur : {activateMutation.error.message}</div>
      )}
      {startVotingMutation.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">Erreur : {startVotingMutation.error.message}</div>
      )}
      {selectMutation.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">Erreur : {selectMutation.error.message}</div>
      )}
      {completeMutation.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">Erreur : {completeMutation.error.message}</div>
      )}
      {cancelMutation.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">Erreur : {cancelMutation.error.message}</div>
      )}

      {!hasSelection && status === 'voting' && (
        <p className="text-xs text-muted">
          Selectionnez un restaurant avant de terminer la session.
        </p>
      )}
      {!hasCandidates && allowedTransitions.includes('voting') && (
        <p className="text-xs text-muted">
          Ajoutez au moins un candidat avant de lancer le vote.
        </p>
      )}
    </div>
  );
}
