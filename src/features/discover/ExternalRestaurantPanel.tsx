import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  useExternalRestaurantSearchQuery,
  useImportExternalRestaurantMutation,
} from './discovery-queries';
import type { ExternalRestaurant } from '@/types/api';
import type { NormalizedApiError } from '@/services/api-client';

function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded bg-danger/10 p-4">
      <p className="text-sm text-danger">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 text-sm font-semibold text-danger underline transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Réessayer
        </button>
      )}
    </div>
  );
}

function getErrorMessage(status: number, message: string): string {
  if (status === 429) return 'Trop de requêtes. Réessaie plus tard.';
  if (status === 409) return 'Ce candidat est déjà présent dans la session.';
  if (status >= 502 && status <= 504) return 'Service temporairement indisponible. Réessaie dans un instant.';
  return message || 'Erreur de chargement des restaurants externes.';
}

function ExternalCandidateCard({
  candidate,
  onImport,
  isImporting,
  importedId,
}: {
  candidate: ExternalRestaurant;
  onImport: (candidate: ExternalRestaurant) => void;
  isImporting: boolean;
  importedId: string | null;
}) {
  const isImported = importedId === `${candidate.provider}:${candidate.providerPlaceId}`;

  return (
    <article className="rounded-card bg-surface p-5 shadow-soft">
      <div className="mb-4 flex h-32 items-center justify-center rounded-[20px] bg-soft">
        <span className="text-sm text-muted">Aucune photo</span>
      </div>

      <h3 className="text-lg font-bold text-fg">{candidate.name}</h3>
      <p className="mt-1 text-sm text-muted">{candidate.address}</p>

      {candidate.cuisineTags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {candidate.cuisineTags.map((tag: string) => (
            <span
              key={tag}
              className="rounded-full bg-soft px-3 py-1 text-xs font-medium text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 space-y-1">
        {candidate.phone && (
          <p className="text-sm text-fg">Téléphone : {candidate.phone}</p>
        )}
        {candidate.website && (
          <p className="text-sm text-fg">
            Site web :{' '}
            <a
              href={candidate.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {candidate.website}
            </a>
          </p>
        )}
      </div>

      <div className="mt-3">
        <span className="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          Candidat externe — {candidate.provider}
        </span>
      </div>

      <div className="mt-4">
        {isImported ? (
          <p className="text-sm font-semibold text-success">Importé avec succès</p>
        ) : (
          <button
            type="button"
            onClick={() => onImport(candidate)}
            disabled={isImporting}
            className="rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {isImporting ? 'Import en cours…' : 'Importer'}
          </button>
        )}
      </div>
    </article>
  );
}

function AuditResult({
  response,
}: {
  response: {
    matchedBy: string;
    restaurantCreated: boolean;
    sourceLinked: boolean;
    sourceAction: string;
    candidateAdded: boolean;
    transactional: boolean;
  };
}) {
  return (
    <div className="rounded bg-success/10 p-4">
      <p className="text-sm font-semibold text-success">Import réussi</p>
      <ul className="mt-2 space-y-1 text-sm text-fg">
        <li>Correspondance : {response.matchedBy}</li>
        <li>Restaurant créé : {response.restaurantCreated ? 'Oui' : 'Non'}</li>
        <li>Source liée : {response.sourceLinked ? 'Oui' : 'Non'}</li>
        <li>Action source : {response.sourceAction}</li>
        <li>Candidat ajouté : {response.candidateAdded ? 'Oui' : 'Non'}</li>
        <li>Transactionnel : {response.transactional ? 'Oui' : 'Non'}</li>
      </ul>
    </div>
  );
}

export function ExternalRestaurantPanel() {
  const [latInput, setLatInput] = useState('');
  const [lngInput, setLngInput] = useState('');
  const [limitInput, setLimitInput] = useState('10');
  const [searchParams, setSearchParams] = useState<{ lat: number; lng: number; limit: number } | null>(null);
  const [importedKey, setImportedKey] = useState<string | null>(null);
  const [lastImportResult, setLastImportResult] = useState<{
    matchedBy: string;
    restaurantCreated: boolean;
    sourceLinked: boolean;
    sourceAction: string;
    candidateAdded: boolean;
    transactional: boolean;
    restaurantId?: string;
  } | null>(null);

  const searchQuery = useExternalRestaurantSearchQuery(
    searchParams
      ? {
          lat: searchParams.lat,
          lng: searchParams.lng,
          limit: searchParams.limit,
          includeRoute: false,
        }
      : { lat: NaN, lng: NaN, limit: 10 },
    { enabled: searchParams !== null },
  );

  const importMutation = useImportExternalRestaurantMutation();

  const handleSearch = useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const lat = parseFloat(latInput);
      const lng = parseFloat(lngInput);
      let limit = parseInt(limitInput, 10);

      if (Number.isNaN(lat) || Number.isNaN(lng)) return;
      if (Number.isNaN(limit) || limit <= 0) limit = 10;
      if (limit > 20) limit = 20;

      setSearchParams({ lat, lng, limit });
      setLastImportResult(null);
      setImportedKey(null);
    },
    [latInput, lngInput, limitInput],
  );

  const handleRetrySearch = useCallback(() => {
    searchQuery.refetch();
  }, [searchQuery]);

  const handleImport = useCallback(
    (candidate: ExternalRestaurant) => {
      setLastImportResult(null);
      importMutation.mutate(
        {
          provider: candidate.provider,
          providerPlaceId: candidate.providerPlaceId,
        },
        {
          onSuccess: (data) => {
            setImportedKey(`${candidate.provider}:${candidate.providerPlaceId}`);
            setLastImportResult({
              matchedBy: data.matchedBy,
              restaurantCreated: data.restaurantCreated,
              sourceLinked: data.sourceLinked,
              sourceAction: data.sourceAction,
              candidateAdded: data.candidateAdded,
              transactional: data.transactional,
              restaurantId: data.restaurant.id,
            });
          },
        },
      );
    },
    [importMutation],
  );

  const candidates = searchQuery.data?.data ?? [];

  return (
    <div className="grid gap-6">
      <form
        onSubmit={handleSearch}
        className="grid gap-4 rounded-card bg-surface p-5 shadow-soft"
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-1">
            <label htmlFor="ext-lat" className="text-sm font-medium text-fg">
              Latitude
            </label>
            <input
              id="ext-lat"
              type="number"
              step="any"
              value={latInput}
              onChange={(e) => setLatInput(e.target.value)}
              placeholder="48.8566"
              className="rounded-full border border-border px-4 py-3 text-fg outline-primary"
            />
          </div>
          <div className="grid gap-1">
            <label htmlFor="ext-lng" className="text-sm font-medium text-fg">
              Longitude
            </label>
            <input
              id="ext-lng"
              type="number"
              step="any"
              value={lngInput}
              onChange={(e) => setLngInput(e.target.value)}
              placeholder="2.3522"
              className="rounded-full border border-border px-4 py-3 text-fg outline-primary"
            />
          </div>
        </div>

        <div className="grid gap-1">
          <label htmlFor="ext-limit" className="text-sm font-medium text-fg">
            Limite (max 20)
          </label>
          <input
            id="ext-limit"
            type="number"
            value={limitInput}
            onChange={(e) => setLimitInput(e.target.value)}
            className="rounded-full border border-border px-4 py-3 text-fg outline-primary"
          />
        </div>

        <button
          type="submit"
          disabled={searchQuery.isLoading}
          className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {searchQuery.isLoading ? 'Recherche en cours…' : 'Rechercher'}
        </button>
      </form>

      {searchQuery.isError && searchQuery.error && (
        <ErrorBanner
          message={getErrorMessage(
            (searchQuery.error as NormalizedApiError)?.status ?? 500,
            (searchQuery.error as NormalizedApiError)?.message ?? '',
          )}
          onRetry={handleRetrySearch}
        />
      )}

      {importMutation.isError && importMutation.error && (
        <ErrorBanner
          message={getErrorMessage(
            (importMutation.error as NormalizedApiError)?.status ?? 500,
            (importMutation.error as NormalizedApiError)?.message ?? '',
          )}
        />
      )}

      {lastImportResult && (
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <AuditResult response={lastImportResult} />
          {lastImportResult.restaurantId && (
            <div className="mt-3">
              <Link
                to={`/restaurants/${lastImportResult.restaurantId}`}
                className="text-sm font-semibold text-primary underline transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Voir le restaurant importé
              </Link>
            </div>
          )}
        </div>
      )}

      {searchParams && !searchQuery.isLoading && !searchQuery.isError && candidates.length === 0 && (
        <p className="text-sm text-muted">Aucun candidat externe trouvé.</p>
      )}

      {candidates.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {candidates.map((candidate) => (
            <ExternalCandidateCard
              key={`${candidate.provider}:${candidate.providerPlaceId}`}
              candidate={candidate}
              onImport={handleImport}
              isImporting={importMutation.isPending}
              importedId={importedKey}
            />
          ))}
        </div>
      )}
    </div>
  );
}
