import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSessionsQuery, sessionStatusLabel, sessionStatusTone } from './session-queries';
import { formatDate } from '@/lib/formatters';
import type { VoteSession } from '@/types/api';

function StatusBadge({ status }: { status: VoteSession['status'] }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${sessionStatusTone(status)}`}>
      {sessionStatusLabel(status)}
    </span>
  );
}

function SessionCard({ session, onSelect }: { session: VoteSession; onSelect: (id: string) => void }) {
  return (
    <article
      className="rounded-card bg-surface p-5 shadow-soft cursor-pointer transition-transform duration-150 ease-out active:scale-[0.97]"
      onClick={() => onSelect(session.id)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect(session.id); }}
      tabIndex={0}
      role="button"
      aria-label={`Session ${session.name}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-fg">{session.name}</h3>
          {session.description && (
            <p className="mt-1 text-sm text-muted line-clamp-2">{session.description}</p>
          )}
        </div>
        <StatusBadge status={session.status} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted">
        {session.deadline && (
          <span>
            Échéance : <span className="text-fg">{formatDate(session.deadline)}</span>
          </span>
        )}
        <span>
          Créée le {formatDate(session.createdAt)}
        </span>
      </div>
    </article>
  );
}

export function SessionsPage() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const {
    data: sessionsPage,
    isLoading,
    error,
  } = useSessionsQuery(groupId ?? '', cursor, 20);

  const sessions = sessionsPage?.data ?? [];
  const nextCursor = sessionsPage?.meta?.nextCursor ?? null;

  if (!groupId) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de groupe manquant.
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg">Sessions</h1>
          <p className="mt-1 text-sm text-muted">Gère les sessions de vote pour ce groupe.</p>
        </div>
        <button
          type="button"
          className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={() => navigate(`/groupes/${groupId}`)}
        >
          Retour au groupe
        </button>
      </header>

      {isLoading && (
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" aria-label="Chargement des sessions..." className="text-sm text-muted">
            Chargement des sessions...
          </p>
        </div>
      )}

      {error && (
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Impossible de charger les sessions. Veuillez réessayer.
        </div>
      )}

      {!isLoading && !error && sessions.length === 0 && (
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p className="text-muted">Aucune session pour le moment.</p>
          <p className="mt-2 text-sm text-muted">
            Reviens sur la page du groupe pour créer une session.
          </p>
        </div>
      )}

      {!isLoading && !error && sessions.length > 0 && (
        <div className="grid gap-4">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onSelect={(id) => navigate(`/sessions/${id}`)}
            />
          ))}
        </div>
      )}

      {!isLoading && !error && nextCursor && (
        <div className="flex justify-center">
          <button
            type="button"
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            onClick={() => setCursor(nextCursor)}
          >
            Afficher plus
          </button>
        </div>
      )}
    </div>
  );
}
