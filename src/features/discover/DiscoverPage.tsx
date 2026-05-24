import { useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Hero, MapPlaceholder } from '@/components/ui';
import { RestaurantCard } from '@/components/ui';
import { useDiscoveryGeocode, useDiscoveryNearby, hasCoords, GEOCODE_MIN_LENGTH } from './discovery-queries';
import { ROUTES } from '@/lib';
import type { Restaurant } from '@/types/api';
import type { NormalizedApiError } from '@/services/api-client';

type Coords = { lat: number; lng: number };

function GeolocationButton({ onCoords }: { onCoords: (lat: number, lng: number) => void }) {
  const [error, setError] = useState<string | null>(null);

  const handleClick = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Accès à la localisation non supporté. Saisis une adresse pour rechercher.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setError(null);
        onCoords(position.coords.latitude, position.coords.longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setError('Accès à la localisation refusé. Saisis une adresse pour rechercher.');
        } else {
          setError('Impossible de déterminer ta position. Saisis une adresse pour rechercher.');
        }
      },
    );
  }, [onCoords]);

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
      >
        Autour de moi
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm text-danger">{error}</p>
      )}
    </div>
  );
}

function RestaurantCardLinked({ restaurant }: { restaurant: Restaurant }) {
  return (
    <Link
      to={`/restaurants/${restaurant.id}`}
      className="block rounded-card transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      <RestaurantCard restaurant={restaurant} />
    </Link>
  );
}

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
  if (status >= 502 && status <= 504) return 'Service temporairement indisponible. Réessaie dans un instant.';
  return message || 'Erreur de chargement des restaurants.';
}

export function DiscoverPage() {
  const [addressQuery, setAddressQuery] = useState('');
  const [submittedAddress, setSubmittedAddress] = useState('');
  const [geoCoords, setGeoCoords] = useState<Coords | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const geocodeQuery = useDiscoveryGeocode(submittedAddress);

  const geocodedCoords = (() => {
    if (!geocodeQuery.data) return null;
    const results = Array.isArray(geocodeQuery.data) ? geocodeQuery.data : [geocodeQuery.data];
    const first = results[0];
    if (first && hasCoords(first)) return { lat: first.lat, lng: first.lng };
    return null;
  })();

  const activeCoords = geoCoords ?? geocodedCoords;

  const nearbyQuery = useDiscoveryNearby(activeCoords, 5000, nextCursor ?? undefined, 20);

  const restaurants = nearbyQuery.data?.data ?? [];
  const hasMore = nearbyQuery.data?.meta.nextCursor ?? null;

  const handleAddressSubmit = useCallback((e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const trimmed = addressQuery.trim();
    if (trimmed.length < GEOCODE_MIN_LENGTH) return;
    setGeoCoords(null);
    setNextCursor(null);
    setSubmittedAddress(trimmed);
  }, [addressQuery]);

  const handleGeolocate = useCallback((lat: number, lng: number) => {
    setSubmittedAddress('');
    setAddressQuery('');
    setNextCursor(null);
    setGeoCoords({ lat, lng });
  }, []);

  const handleLoadMore = useCallback(() => {
    const cursor = nearbyQuery.data?.meta.nextCursor;
    if (cursor) setNextCursor(cursor);
  }, [nearbyQuery.data?.meta.nextCursor]);

  const handleRetry = useCallback(() => {
    nearbyQuery.refetch();
  }, [nearbyQuery]);

  return (
    <div className="grid gap-6">
      <Hero
        title="Découvre le bon resto, au bon moment"
        subtitle="Recherche autour de toi, compare les options, puis lance un vote de groupe."
        actions={
          <>
            <Link
              to={ROUTES.groups}
              className="rounded-full bg-white px-5 py-3 font-bold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Lancer un call
            </Link>
            <Link
              to={ROUTES.groups}
              className="rounded-full border border-white/60 px-5 py-3 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Voir les groupes
            </Link>
          </>
        }
      />

      <form
        onSubmit={handleAddressSubmit}
        className="grid gap-3 rounded-card bg-surface p-4 shadow-soft md:grid-cols-[1fr_auto]"
      >
        <input
          name="query"
          placeholder="Adresse ou quartier"
          value={addressQuery}
          onChange={(e) => setAddressQuery(e.target.value)}
          className="rounded-full border border-border px-4 py-3 text-fg outline-primary"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-full bg-primary px-6 py-3 font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Trouver
          </button>
          <GeolocationButton onCoords={handleGeolocate} />
        </div>
      </form>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <MapPlaceholder />

          {nearbyQuery.isLoading && activeCoords && (
            <p role="status" className="mt-4 text-sm text-muted">Chargement des restaurants…</p>
          )}

          {nearbyQuery.isError && nearbyQuery.error && (
            <ErrorBanner
              message={getErrorMessage(
                (nearbyQuery.error as NormalizedApiError)?.status ?? 500,
                (nearbyQuery.error as NormalizedApiError)?.message ?? '',
              )}
              onRetry={handleRetry}
            />
          )}

          {!nearbyQuery.isLoading && !nearbyQuery.isError && activeCoords && restaurants.length === 0 && (
            <p className="mt-4 text-sm text-muted">Aucun restaurant trouvé à proximité.</p>
          )}

          {!nearbyQuery.isLoading && !nearbyQuery.isError && !activeCoords && (
            <p className="mt-4 text-sm text-muted">Saisis une adresse ou active la localisation pour découvrir les restaurants autour de toi.</p>
          )}

          {restaurants.length > 0 && (
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              {restaurants.map((restaurant) => (
                <RestaurantCardLinked key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          )}

          {hasMore && !nearbyQuery.isLoading && (
            <button
              type="button"
              onClick={handleLoadMore}
              className="mt-4 w-full rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Afficher plus
            </button>
          )}
        </div>

        <aside className="grid gap-4">
          <div className="rounded-card bg-surface p-5 shadow-soft">
            <p className="text-sm text-muted">
              Les résultats de vote apparaîtront ici quand tu lanceras une session.
            </p>
          </div>
        </aside>
      </section>
    </div>
  );
}