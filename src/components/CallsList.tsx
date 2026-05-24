import { useCallback, useState } from 'react';
import { useSessionCallsQuery } from '@/features/sessions/session-queries';
import { useDeleteCallMutation } from '@/features/server-state';
import type { FoodCall, SessionStatus } from '@/types/api';

interface CallItemProps {
  call: FoodCall;
  isAuthor: boolean;
  sessionState: SessionStatus;
  onDelete: (callId: string) => void;
  isDeleting: boolean;
}

function CallItem({ call, isAuthor, sessionState, onDelete, isDeleting }: CallItemProps) {
  const canDelete = isAuthor && (sessionState === 'active' || sessionState === 'voting');
  const authorLabel = isAuthor ? 'Vous' : `Utilisateur ${call.userId}`;

  return (
    <article className="rounded-card bg-surface p-4 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-fg">
            {call.restaurant?.name ?? call.restaurantId}
          </p>
          <p className="mt-1 text-muted text-sm">{call.pitch}</p>
          <p className="mt-2 text-xs text-muted">
            {authorLabel}
          </p>
        </div>
        {canDelete && (
          <button
            type="button"
            disabled={isDeleting}
            onClick={() => onDelete(call.id)}
            className="rounded-radius bg-danger/10 px-3 py-1.5 text-xs font-semibold text-danger transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50 shrink-0"
          >
            {isDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
        )}
      </div>
    </article>
  );
}

interface CallsListProps {
  sessionId: string;
  sessionState: SessionStatus;
  currentUserId: string;
  onCallDeleted?: () => void;
}

export function CallsList({ sessionId, sessionState, currentUserId, onCallDeleted }: CallsListProps) {
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [allCalls, setAllCalls] = useState<FoodCall[]>([]);

  const { data, isLoading, error, refetch } = useSessionCallsQuery(sessionId, cursor);

  const deleteCallMutation = useDeleteCallMutation();

  const [deletingCallId, setDeletingCallId] = useState<string | null>(null);

  const handleDelete = useCallback((callId: string) => {
    setDeletingCallId(callId);
    deleteCallMutation.mutate(
      { callId, sessionId },
      {
        onSettled: () => setDeletingCallId(null),
        onSuccess: () => onCallDeleted?.(),
      },
    );
  }, [deleteCallMutation, sessionId, onCallDeleted]);

  const mergedCalls = (() => {
    if (!data) return allCalls;
    if (cursor === undefined) return data.data;
    const existingIds = new Set(allCalls.map((c) => c.id));
    const newCalls = data.data.filter((c) => !existingIds.has(c.id));
    return [...allCalls, ...newCalls];
  })();

  const loadMore = useCallback(() => {
    if (data?.meta.nextCursor) {
      setAllCalls(mergedCalls);
      setCursor(data.meta.nextCursor);
    }
  }, [data, mergedCalls]);

  if (isLoading && allCalls.length === 0) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <p role="status" className="text-sm text-muted">Chargement des calls...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <div role="alert" className="rounded bg-danger/10 p-4 text-sm text-danger">
          Impossible de charger les calls.
        </div>
        <button
          type="button"
          className="mt-3 rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          onClick={() => refetch()}
        >
          Reessayer
        </button>
      </div>
    );
  }

  if (mergedCalls.length === 0) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <p className="text-sm text-muted">Aucun call pour cette session.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {mergedCalls.map((call) => (
        <CallItem
          key={call.id}
          call={call}
          isAuthor={call.userId === currentUserId}
          sessionState={sessionState}
          onDelete={handleDelete}
          isDeleting={deletingCallId === call.id}
        />
      ))}
      {data?.meta.nextCursor && (
        <button
          type="button"
          onClick={loadMore}
          className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-start"
        >
          Charger plus de calls
        </button>
      )}
    </div>
  );
}
