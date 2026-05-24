import { useParams, Link } from 'react-router-dom';
import {
  useSessionRecommendationsQuery,
  useSessionQuery,
  useSessionCandidatesQuery,
} from './session-queries';
import { RecommendationsList } from '@/components/RecommendationsList';

export function SessionRecommendationsPage() {
  const { id } = useParams<{ id: string }>();

  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
  } = useSessionQuery(id ?? '', { enabled: !!id });

  const { data: candidates } = useSessionCandidatesQuery(id ?? '', { enabled: !!id });

  const {
    data: recommendationsPage,
    isLoading: recsLoading,
    error: recsError,
    refetch,
  } = useSessionRecommendationsQuery(id ?? '');

  if (!id) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de session manquant.
        </div>
      </div>
    );
  }

  if (sessionLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" className="text-sm text-muted">
            Chargement de la session...
          </p>
        </div>
      </div>
    );
  }

  if (sessionError) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Impossible de charger la session.
        </div>
        <Link
          to="/"
          className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Retour a l'accueil
        </Link>
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

  const isCompleted = session.status === 'completed';
  const hasCandidates = candidates && candidates.length > 0;

  if (isCompleted) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">
            Recommandations pour {session.name}
          </h1>
          <Link
            to={`/sessions/${session.id}`}
            className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Retour a la session
          </Link>
        </div>
        <div className="rounded-card bg-surface p-6 shadow-soft text-center">
          <p className="text-sm text-muted">
            Cette session est terminee. Consultez le restaurant selectionne ou creez une nouvelle session.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold text-fg">
            Recommandations pour {session.name}
          </h1>
          <p className="text-sm text-muted max-w-[75ch]">
            Ces suggestions sont basees sur la qualite, la distance, le budget et l'historique de vote. Le choix final vous appartient.
          </p>
        </div>
        <Link
          to={`/sessions/${session.id}`}
          className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97] shrink-0"
        >
          Retour a la session
        </Link>
      </div>

      {!hasCandidates ? (
        <div className="rounded-card bg-surface p-6 shadow-soft text-center">
          <p className="text-sm text-muted">
            Ajoutez des candidats pour obtenir des recommandations.
          </p>
        </div>
      ) : (
        <RecommendationsList
          recommendations={recommendationsPage?.data ?? []}
          status={recsLoading ? 'pending' : recsError ? 'error' : 'success'}
          error={recsError}
          meta={recommendationsPage?.meta ?? { nextCursor: null }}
          onRefresh={() => refetch()}
          emptyReason="Ajoutez des candidats pour obtenir des recommandations."
        />
      )}
    </div>
  );
}
