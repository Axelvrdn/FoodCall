import { useParams, Link } from 'react-router-dom';
import { useGroupRecommendationsQuery } from '@/features/server-state';
import { useGroupQuery } from './group-queries';
import { RecommendationsList } from '@/components/RecommendationsList';

export function GroupRecommendationsPage() {
  const { groupId, id: legacyId } = useParams<{ groupId?: string; id?: string }>();
  const id = groupId ?? legacyId ?? '';

  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupQuery(id, { enabled: !!id });

  const {
    data: recommendationsPage,
    isLoading: recsLoading,
    error: recsError,
    refetch,
  } = useGroupRecommendationsQuery(id);

  if (!id) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de groupe manquant.
        </div>
      </div>
    );
  }

  if (groupLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" className="text-sm text-muted">
            Chargement du groupe...
          </p>
        </div>
      </div>
    );
  }

  if (groupError) {
    const is404 = groupError.status === 404;
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          {is404
            ? "Ce groupe n'existe pas ou a ete supprime."
            : 'Impossible de charger le groupe.'}
        </div>
        <Link
          to="/groupes"
          className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Retour aux groupes
        </Link>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Groupe introuvable.
        </div>
      </div>
    );
  }

  const hasLocation = group.defaultStartLatitude != null && group.defaultStartLongitude != null;

  if (!hasLocation) {
    return (
      <div className="grid gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-fg">
            Recommandations pour {group.name}
          </h1>
          <Link
            to={`/groupes/${group.id}`}
            className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Retour au groupe
          </Link>
        </div>
        <div className="rounded-card bg-surface p-6 shadow-soft text-center">
          <p className="text-sm text-muted mb-3">
            Definissez un lieu de depart par defaut pour votre groupe afin d'obtenir des recommandations de restaurants a proximite.
          </p>
          <Link
            to={`/groupes/${group.id}`}
            className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Parametres du groupe
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <div className="grid gap-2">
          <h1 className="text-2xl font-bold text-fg">
            Recommandations pour {group.name}
          </h1>
          <p className="text-sm text-muted max-w-[75ch]">
            Base sur la localisation de votre groupe et son historique, voici les restaurants a proximite que nous recommandons.
          </p>
        </div>
        <Link
          to={`/groupes/${group.id}`}
          className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97] shrink-0"
        >
          Retour au groupe
        </Link>
      </div>

      <RecommendationsList
        recommendations={recommendationsPage?.data ?? []}
        status={recsLoading ? 'pending' : recsError ? 'error' : 'success'}
        error={recsError}
        meta={recommendationsPage?.meta ?? { nextCursor: null }}
        onRefresh={() => refetch()}
        emptyReason="Aucun restaurant a proximite pour le moment."
      />
    </div>
  );
}
