import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { Link } from 'react-router-dom';
import {
  useSessionQuery,
  useSessionCandidatesQuery,
  useSessionVotesQuery,
  useSessionResultsQuery,
  useCastVoteMutation,
  useDeleteVoteMutation,
  useCreateCallMutation,
  sessionStatusLabel,
  sessionStatusTone,
} from './session-queries';
import { SessionStateControls } from './SessionStateControls';
import { CallsList } from '@/components/CallsList';
import { useGroupQuery } from '@/features/groups/group-queries';
import { formatBudget, formatDistance, formatDate } from '@/lib/formatters';
import type { SessionStatus } from '@/types/api';

function StatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${sessionStatusTone(status)}`}>
      {sessionStatusLabel(status)}
    </span>
  );
}

export function SessionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [removedVoteIds, setRemovedVoteIds] = useState<Set<string>>(() => new Set());

  const {
    data: session,
    isLoading,
    error,
  } = useSessionQuery(id ?? '', { enabled: !!id });

  const { data: group } = useGroupQuery(session?.groupId ?? '', { enabled: !!session?.groupId });
  const { data: candidates } = useSessionCandidatesQuery(session?.id ?? '', { enabled: !!session?.id });
  const { data: votesPage } = useSessionVotesQuery(session?.id ?? '', undefined, undefined, {
    enabled: !!session?.id && (session.status === 'voting' || session.status === 'completed'),
  });
  const { data: results } = useSessionResultsQuery(session?.id ?? '', {
    enabled: !!session?.id && session.status === 'completed',
  });
  const castVote = useCastVoteMutation();
  const deleteVote = useDeleteVoteMutation(session?.id ?? '');

  if (!id) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de session manquant.
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" aria-label="Chargement de la session..." className="text-sm text-muted">
            Chargement de la session...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    const is404 = error.status === 404;
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          {is404
            ? "Cette session n'existe pas ou a ete supprimee."
            : 'Impossible de charger la session. Veuillez reessayer.'}
        </div>
        <button
          type="button"
          className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-start"
          onClick={() => navigate(-1)}
        >
          Retour
        </button>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Session introuvable.
        </div>
      </div>
    );
  }

  const votes = (votesPage?.data ?? []).filter((vote) => !removedVoteIds.has(vote.id));
  const myVotes = votes.filter((vote) => vote.userId === user?.id);
  const votesByCandidate = new Map<string, number>();
  for (const vote of votes) {
    votesByCandidate.set(vote.candidateId, (votesByCandidate.get(vote.candidateId) ?? 0) + 1);
  }
  const selectedCandidate = candidates?.find((candidate) => candidate.restaurantId === session.selectedRestaurantId);
  const selectedResult = results?.find((result) => result.restaurantId === session.selectedRestaurantId);
  const selectedRestaurantName = selectedCandidate?.restaurant?.name ?? selectedResult?.restaurantName;

  return (
    <div className="grid gap-6">
      <div className="flex items-start justify-between gap-4">
        <button
          type="button"
          className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={() => navigate(-1)}
        >
          Retour
        </button>
      </div>

      <header className="grid gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-bold text-fg">{session.name}</h1>
          <StatusBadge status={session.status} />
        </div>
        {session.description && (
          <p className="text-muted max-w-[75ch]">{session.description}</p>
        )}
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-6">
          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-bold text-fg">Details de la session</h2>

            {group && (
              <p className="text-sm text-muted">
                Groupe :{' '}
                <button
                  type="button"
                  className="text-primary font-semibold transition-transform duration-150 ease-out active:scale-[0.97]"
                  onClick={() => navigate(`/groupes/${group.id}`)}
                >
                  {group.name}
                </button>
              </p>
            )}

            <p className="text-sm text-muted">
              Type de vote :{' '}
              <span className="text-fg font-semibold">
                {session.voteType === 'approval' ? 'Approbation' : session.voteType}
              </span>
            </p>

            {session.deadline && (
              <p className="text-sm text-muted">
                Echeance : <span className="text-fg">{formatDate(session.deadline)}</span>
              </p>
            )}

            <p className="text-sm text-muted">
              Creee le : <span className="text-fg">{formatDate(session.createdAt)}</span>
            </p>

            {session.completedAt && (
              <p className="text-sm text-muted">
                Terminee le : <span className="text-fg">{formatDate(session.completedAt)}</span>
              </p>
            )}
          </div>

          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-bold text-fg">Parametres par defaut</h2>
            {session.startAddress ? (
              <p className="text-sm text-muted">
                Depart : <span className="text-fg">{session.startAddress}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">Aucune adresse de départ définie.</p>
            )}
            {session.startLatitude != null && session.startLongitude != null && (
              <p className="text-sm text-muted">
                Coordonnees :{' '}
                <span className="font-mono text-fg">
                  {session.startLatitude}, {session.startLongitude}
                </span>
              </p>
            )}
            {session.searchRadiusMeters != null ? (
              <p className="text-sm text-muted">
                Rayon : <span className="text-fg">{formatDistance(session.searchRadiusMeters)}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">Aucun rayon de recherche défini.</p>
            )}
            {session.budgetMax ? (
              <p className="text-sm text-muted">
                Budget : <span className="font-mono font-semibold text-fg">{formatBudget(session.budgetMax)}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">Aucun budget maximum défini.</p>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-bold text-fg">Restaurant selectionne</h2>
            {session.selectedRestaurantId ? (
              <div className="grid gap-1">
                <p className="text-sm text-muted">
                  {selectedRestaurantName ? (
                    <>Restaurant sélectionné : <span className="text-fg font-semibold">{selectedRestaurantName}</span></>
                  ) : (
                    <>Restaurant : <span className="text-fg font-mono">{session.selectedRestaurantId}</span></>
                  )}
                </p>
                {selectedRestaurantName && (
                  <p className="text-xs text-muted">
                    Identifiant : <span className="font-mono text-fg">{session.selectedRestaurantId}</span>
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">Pas encore selectionne.</p>
            )}
          </div>

          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">Candidats</h2>
              <Link
                to={`/sessions/${session.id}/candidates`}
                className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Voir les candidats
              </Link>
            </div>
            {candidates && candidates.length > 0 ? (
              <p className="text-sm text-muted">{candidates.length} candidat{candidates.length > 1 ? 's' : ''}</p>
            ) : (
              <p className="text-sm text-muted">Aucun candidat pour le moment.</p>
            )}
          </div>

          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-fg">Recommandations</h2>
              <Link
                to={`/sessions/${session.id}/recommendations`}
                className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Voir les recommandations
              </Link>
            </div>
            <p className="text-sm text-muted">
              Suggestions basees sur la qualite, la distance, le budget et votre historique.
            </p>
          </div>

          <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
            <h2 className="text-lg font-bold text-fg">Votes</h2>
            {castVote.error && (
              <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
                Vote impossible : {castVote.error.message}
              </div>
            )}
            {deleteVote.error && (
              <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
                Suppression du vote impossible : {deleteVote.error.message}
              </div>
            )}
            {session.status === 'voting' && candidates && candidates.length > 0 ? (
              <div className="grid gap-3">
                {candidates.map((candidate) => {
                  const restaurantName = candidate.restaurant?.name ?? candidate.restaurantId;
                  const myVote = myVotes.find((vote) => vote.candidateId === candidate.id);
                  const voteCount = votesByCandidate.get(candidate.id) ?? 0;
                  return (
                    <div key={candidate.id} className="flex flex-wrap items-center justify-between gap-3 rounded-radius border border-border bg-soft px-3 py-2">
                      <div className="grid gap-1">
                        <p className="text-sm font-semibold text-fg">{restaurantName}</p>
                        <p className="text-xs text-muted">{voteCount} vote{voteCount !== 1 ? 's' : ''}</p>
                      </div>
                      {myVote ? (
                        <button
                          type="button"
                          disabled={deleteVote.isPending}
                          className="rounded-radius bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                          onClick={() => {
                            setRemovedVoteIds((current) => new Set(current).add(myVote.id));
                            deleteVote.mutate(myVote.id, {
                              onError: () => {
                                setRemovedVoteIds((current) => {
                                  const next = new Set(current);
                                  next.delete(myVote.id);
                                  return next;
                                });
                              },
                            });
                          }}
                        >
                          Retirer mon vote pour {restaurantName}
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={!user || castVote.isPending}
                          className="rounded-radius bg-primary px-3 py-1.5 text-xs font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                          onClick={() => castVote.mutate({ sessionId: session.id, candidateId: candidate.id })}
                        >
                          Voter pour {restaurantName}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : session.status === 'completed' ? (
              <div className="grid gap-3">
                <h3 className="text-sm font-semibold text-fg">Résultats</h3>
                {results && results.length > 0 ? (
                  results.map((result) => (
                    <div key={result.candidateId} className="flex flex-wrap items-center justify-between gap-3 rounded-radius border border-border bg-soft px-3 py-2">
                      <div className="grid gap-1">
                        <p className="text-sm font-semibold text-fg">{result.restaurantName}</p>
                        {result.creatorApproved && (
                          <p className="text-xs text-success">Validé par le créateur</p>
                        )}
                      </div>
                      <span className="font-mono text-sm font-semibold text-fg">
                        {result.votes} vote{result.votes !== 1 ? 's' : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted">Aucun résultat retourné par le backend.</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted">
                Les votes seront disponibles pendant la phase de vote.
              </p>
            )}
          </div>

          <SessionStateControls
            sessionId={session.id}
            status={session.status}
            createdBy={session.createdBy}
            currentUserId={user?.id}
            selectedRestaurantId={session.selectedRestaurantId}
            candidates={candidates}
          />
        </div>
      </section>

      <section className="grid gap-6 rounded-card bg-surface p-5 shadow-soft">
        <h2 className="text-lg font-bold text-fg">Calls</h2>
        {user && (session.status === 'active' || session.status === 'voting') && candidates && candidates.length > 0 ? (
          <CallCreationForm
            sessionId={session.id}
            restaurantId={(candidates[0]?.restaurantId ?? '')}
            candidates={candidates}
          />
        ) : null}
        {user && (
          <CallsList
            sessionId={session.id}
            sessionState={session.status}
            currentUserId={user.id}
          />
        )}
      </section>
    </div>
  );
}

function CallCreationForm({
  sessionId,
  restaurantId: defaultRestaurantId,
  candidates,
}: {
  sessionId: string;
  restaurantId: string;
  candidates: NonNullable<ReturnType<typeof useSessionCandidatesQuery>['data']>;
}) {
  const [restaurantId, setRestaurantId] = useState(defaultRestaurantId);
  const [pitch, setPitch] = useState('');
  const createCall = useCreateCallMutation();

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId || !pitch.trim()) return;
    createCall.mutate(
      { sessionId, payload: { restaurantId, pitch: pitch.trim() } },
      { onSuccess: () => setPitch('') },
    );
  }, [sessionId, restaurantId, pitch, createCall]);

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      {createCall.error && (
        <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
          Erreur : {createCall.error.status === 409
            ? 'Un call existe deja pour ce restaurant.'
            : createCall.error.message}
        </div>
      )}
      <div className="grid gap-2">
        <label htmlFor="call-restaurant" className="text-sm font-semibold text-fg">
          Restaurant
        </label>
        <select
          id="call-restaurant"
          value={restaurantId}
          onChange={(e) => setRestaurantId(e.target.value)}
          className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg"
        >
          {candidates.map((c) => (
            <option key={c.id} value={c.restaurantId}>
              {c.restaurant?.name ?? c.restaurantId}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <label htmlFor="call-pitch" className="text-sm font-semibold text-fg">
          Pitch
        </label>
        <input
          id="call-pitch"
          type="text"
          value={pitch}
          onChange={(e) => setPitch(e.target.value)}
          maxLength={2000}
          className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg placeholder:text-muted"
          placeholder="Pourquoi ce restaurant..."
        />
      </div>
      <button
        type="submit"
        disabled={!restaurantId || !pitch.trim() || createCall.isPending}
        className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50 self-start"
      >
        {createCall.isPending ? 'Envoi...' : 'Ajouter un call'}
      </button>
    </form>
  );
}
