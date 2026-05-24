import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import { useSessionQuery, useSessionVotesQuery } from './session-queries';
import {
  useSessionCandidatesQuery,
  useAddCandidateMutation,
  useRemoveCandidateMutation,
} from './candidate-queries';
import {
  useRestaurantsSearchQuery,
  useExternalRestaurantSearchQuery,
  useImportExternalRestaurantMutation,
} from '@/features/discover/discovery-queries';
import { formatDistance } from '@/lib/formatters';
import type { Restaurant } from '@/types/api';

export function CandidatesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);

  const { data: session, isLoading: sessionLoading, error: sessionError } =
    useSessionQuery(id ?? '', { enabled: !!id });
  const { data: candidates, isLoading: candLoading, error: candError } =
    useSessionCandidatesQuery(id ?? '', { enabled: !!id });
  const { data: votesList } = useSessionVotesQuery(id ?? '', undefined, undefined, { enabled: !!id });
  const addMutation = useAddCandidateMutation();
  const removeMutation = useRemoveCandidateMutation();
  const importMutation = useImportExternalRestaurantMutation();

  const [restaurantSearch, setRestaurantSearch] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [externalSearch, setExternalSearch] = useState('');

  const trimmedRestaurantSearch = restaurantSearch.trim();
  const trimmedExternalSearch = externalSearch.trim();
  const sessionLat = Number(session?.startLatitude ?? 0);
  const sessionLng = Number(session?.startLongitude ?? 0);

  const { data: restaurantResults, isFetching: isSearchingRestaurants } = useRestaurantsSearchQuery(
    trimmedRestaurantSearch,
    undefined,
    5,
    { enabled: trimmedRestaurantSearch.length >= 2 },
  );
  const { data: externalResults, isFetching: isSearchingExternal } = useExternalRestaurantSearchQuery(
    {
      lat: sessionLat,
      lng: sessionLng,
      radius: session?.searchRadiusMeters ?? undefined,
      q: trimmedExternalSearch,
      limit: 5,
    },
    { enabled: trimmedExternalSearch.length >= 2 && !Number.isNaN(sessionLat) && !Number.isNaN(sessionLng) },
  );

  if (!id) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de session manquant.
        </div>
        <Link to={`/sessions/${id ?? ''}`} className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-start">
          Retour a la session
        </Link>
      </div>
    );
  }

  if (sessionLoading || candLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" className="text-sm text-muted">
            Chargement des candidats...
          </p>
        </div>
      </div>
    );
  }

  if (sessionError || candError) {
    const err = (sessionError ?? candError) as { status?: number; message?: string } | null;
    const is404 = err?.status === 404;
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          {is404
            ? "Cette session n'existe pas."
            : 'Impossible de charger les candidats. Veuillez reessayer.'}
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

  const isCreator = user?.id === session.createdBy;
  const isEditable = session.status === 'draft' || session.status === 'active';
  const showVoteCount = session.status === 'voting' || session.status === 'completed';

  const voteCounts = new Map<string, number>();
  const votes = Array.isArray(votesList) ? votesList : votesList?.data;
  if (votes) {
    for (const v of votes) {
      voteCounts.set(v.candidateId, (voteCounts.get(v.candidateId) ?? 0) + 1);
    }
  }

  const handleAdd = () => {
    if (!selectedRestaurant) return;
    addMutation.mutate(
      { sessionId: session.id, restaurantId: selectedRestaurant.id },
      {
        onSuccess: () => {
          setRestaurantSearch('');
          setSelectedRestaurant(null);
        },
      },
    );
  };

  return (
    <div className="grid gap-6">
      <div className="flex items-center gap-4">
        <Link
          to={`/sessions/${session.id}`}
          className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Retour
        </Link>
        <h1 className="text-2xl font-bold text-fg">Candidats</h1>
      </div>

      <p className="text-muted max-w-[75ch]">
        Session : <span className="text-fg font-semibold">{session.name}</span>
      </p>

      {isEditable && (
        <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
          <h2 className="text-lg font-bold text-fg">Ajouter un candidat</h2>
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="candidate-restaurant-search" className="text-sm font-semibold text-fg">
                  Rechercher un restaurant
                </label>
                <input
                  id="candidate-restaurant-search"
                  type="text"
                  className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Nom, cuisine, adresse..."
                  value={restaurantSearch}
                  onChange={(e) => {
                    setRestaurantSearch(e.target.value);
                    setSelectedRestaurant(null);
                  }}
                />
              </div>
              {isSearchingRestaurants && <p className="text-xs text-muted">Recherche en cours...</p>}
              {restaurantResults?.data.length ? (
                <div className="grid gap-2">
                  {restaurantResults.data.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      aria-label={`Choisir ${restaurant.name}`}
                      className={`rounded-radius border px-3 py-2 text-left text-sm transition-transform duration-150 ease-out active:scale-[0.98] ${selectedRestaurant?.id === restaurant.id ? 'border-primary bg-primary/10 text-fg' : 'border-border bg-soft text-fg'}`}
                      onClick={() => setSelectedRestaurant(restaurant)}
                    >
                      Choisir {restaurant.name}
                      <span className="block text-xs font-normal text-muted">{restaurant.address}</span>
                    </button>
                  ))}
                </div>
              ) : null}
              {selectedRestaurant && (
                <button
                  type="button"
                  disabled={addMutation.isPending}
                  className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50 justify-self-start"
                  onClick={handleAdd}
                >
                  {addMutation.isPending ? 'Ajout...' : `Ajouter ${selectedRestaurant.name}`}
                </button>
              )}
            </div>

            <div className="grid gap-3">
              <div className="grid gap-1.5">
                <label htmlFor="candidate-external-search" className="text-sm font-semibold text-fg">
                  Rechercher un restaurant externe
                </label>
                <input
                  id="candidate-external-search"
                  type="text"
                  className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Importer via le backend"
                  value={externalSearch}
                  onChange={(e) => setExternalSearch(e.target.value)}
                />
              </div>
              {isSearchingExternal && <p className="text-xs text-muted">Recherche externe en cours...</p>}
              {externalResults?.data.length ? (
                <div className="grid gap-2">
                  {externalResults.data.map((restaurant) => (
                    <button
                      key={`${restaurant.provider}-${restaurant.providerPlaceId}`}
                      type="button"
                      aria-label={`Importer ${restaurant.name}`}
                      disabled={importMutation.isPending}
                      className="rounded-radius border border-border bg-soft px-3 py-2 text-left text-sm text-fg transition-transform duration-150 ease-out active:scale-[0.98] disabled:opacity-50"
                      onClick={() => importMutation.mutate({ provider: restaurant.provider, providerPlaceId: restaurant.providerPlaceId, sessionId: session.id })}
                    >
                      Importer {restaurant.name}
                      <span className="block text-xs font-normal text-muted">{restaurant.address}</span>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
          {addMutation.error && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              Erreur : {addMutation.error.message}
            </div>
          )}
          {importMutation.error && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              Import impossible : {importMutation.error.message}
            </div>
          )}
          {addMutation.isSuccess && (
            <p className="text-sm text-success">Candidat ajoute avec succes.</p>
          )}
          {importMutation.isSuccess && (
            <p className="text-sm text-success">Restaurant importe avec le contexte de session.</p>
          )}
        </div>
      )}

      <div className="grid gap-4">
        {(!candidates || candidates.length === 0) ? (
          <div className="rounded-card bg-surface p-8 shadow-soft text-center">
            <p className="text-muted">
              {isEditable
                ? "Aucun candidat pour le moment. Ajoutez-en un pour commencer."
                : 'Aucun candidat pour cette session.'}
            </p>
          </div>
        ) : (
          candidates.map((c) => {
            const rest = c.restaurant;
            const voteCount = voteCounts.get(c.id) ?? 0;
            return (
              <div
                key={c.id}
                className="grid gap-2 rounded-card bg-surface p-5 shadow-soft"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="grid gap-1">
                    {rest ? (
                      <>
                        <div className="flex items-center gap-3">
                          {rest.photoUrls.length > 0 ? (
                            <img
                              src={rest.photoUrls[0]}
                              alt={rest.name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-soft flex items-center justify-center text-muted text-lg font-bold">
                              {rest.name.charAt(0)}
                            </div>
                          )}
                          <p className="font-semibold text-fg">{rest.name}</p>
                        </div>
                        {rest.cuisineTags.length > 0 && (
                          <p className="text-xs text-muted ml-[52px]">
                            {rest.cuisineTags.join(', ')}
                          </p>
                        )}
                        {rest.address && (
                          <p className="text-xs text-muted ml-[52px]">{rest.address}</p>
                        )}
                        {rest.distanceMeters != null && (
                          <p className="text-xs text-muted ml-[52px]">
                            {formatDistance(rest.distanceMeters)}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="font-mono text-sm text-muted">{c.restaurantId}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    {showVoteCount && (
                      <span className="text-sm font-mono font-semibold text-fg">
                        {voteCount} vote{voteCount !== 1 ? 's' : ''}
                      </span>
                    )}
                    {isCreator && isEditable && (
                      <button
                        type="button"
                        disabled={removeMutation.isPending}
                        className="rounded-radius bg-danger px-3 py-1.5 text-xs font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                        onClick={() => removeMutation.mutate({ sessionId: session.id, candidateId: c.id })}
                      >
                        {removeMutation.isPending ? 'Suppression...' : 'Retirer'}
                      </button>
                    )}
                  </div>
                </div>
                {removeMutation.error && removeMutation.variables?.candidateId === c.id && (
                  <div role="alert" className="rounded bg-danger/10 p-2 text-xs text-danger">
                    Erreur : {removeMutation.error.message}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
