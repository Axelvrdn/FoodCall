import { useCallback, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useRestaurantDetailQuery } from './discovery-queries';
import { useSessionQuery } from '@/features/sessions/session-queries';
import { useDeleteRestaurantMutation, useUpdateRestaurantMutation } from '@/features/server-state';
import { ReviewsList } from '@/components/ReviewsList';
import { ReviewForm } from '@/components/ReviewForm';
import { useAuthStore } from '@/stores/auth-store';
import { ROUTES } from '@/lib';
import type { NormalizedApiError } from '@/services/api-client';

function BackToDiscovery() {
  return (
    <Link
      to={ROUTES.discover}
      className="inline-flex items-center gap-2 text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
    >
      Retour à la découverte
    </Link>
  );
}

function ErrorState({ status, message }: { status: number; message: string }) {
  if (status === 404) {
    return (
      <div role="alert" className="rounded bg-danger/10 p-4">
        <p className="text-sm text-danger">Restaurant introuvable.</p>
        <div className="mt-3">
          <BackToDiscovery />
        </div>
      </div>
    );
  }

  if (status === 403) {
    return (
      <div role="alert" className="rounded bg-danger/10 p-4">
        <p className="text-sm text-danger">Tu n'as pas l'autorisation d'acceder a ce restaurant.</p>
        <div className="mt-3">
          <BackToDiscovery />
        </div>
      </div>
    );
  }

  return (
    <div role="alert" className="rounded bg-danger/10 p-4">
      <p className="text-sm text-danger">{message || 'Erreur de chargement du restaurant.'}</p>
      <div className="mt-3">
        <BackToDiscovery />
      </div>
    </div>
  );
}

function PhotoFallback() {
  return (
    <div className="flex h-48 items-center justify-center rounded-[20px] bg-soft">
      <span className="text-sm text-muted">Aucune photo disponible</span>
    </div>
  );
}

function CuisineTags({ tags }: { tags: string[] }) {
  if (tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span
          key={tag}
          className="rounded-full bg-soft px-3 py-1 text-xs font-medium text-muted"
        >
          {tag}
        </span>
      ))}
    </div>
  );
}

function RatingDisplay({ rating }: { rating?: { average: number | null; count: number } }) {
  if (!rating || rating.count === 0) {
    return <p className="text-sm text-muted">Aucun avis pour le moment</p>;
  }

  const average = rating.average ?? 0;
  return (
    <p className="text-sm text-muted">
      Note : <span className="font-semibold text-fg">{average.toFixed(1)}</span> sur 5
      {' '}({rating.count} avis)
    </p>
  );
}

export function RestaurantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? undefined;
  const user = useAuthStore((s) => s.user);
  const query = useRestaurantDetailQuery(id ?? '');
  const updateRestaurant = useUpdateRestaurantMutation(id ?? '');
  const deleteRestaurant = useDeleteRestaurantMutation(id ?? '');
  const [isEditing, setIsEditing] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const { data: reviewSession } = useSessionQuery(sessionId ?? '', { enabled: !!sessionId });
  const isComplete = reviewSession?.status === 'completed';

  const handleRetry = useCallback(() => {
    query.refetch();
  }, [query]);

  if (query.isLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <p role="status" className="text-sm text-muted">Chargement du restaurant...</p>
        </div>
      </div>
    );
  }

  if (query.isError && query.error) {
    const err = query.error as NormalizedApiError;
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <ErrorState status={err.status} message={err.message} />
        </div>
      </div>
    );
  }

  const restaurant = query.data;
  if (!restaurant) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <ErrorState status={404} message="Restaurant introuvable." />
        </div>
      </div>
    );
  }

  const canManageRestaurant = restaurant.createdBy === user?.id;

  const handleEditSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateRestaurant.mutate(
      {
        name: String(formData.get('name') ?? '').trim(),
        description: String(formData.get('description') ?? '').trim() || null,
        address: String(formData.get('address') ?? '').trim(),
      },
      {
        onSuccess: () => setIsEditing(false),
      },
    );
  };

  const handleDelete = () => {
    deleteRestaurant.mutate(undefined, {
      onSuccess: () => navigate(ROUTES.discover),
    });
  };

  return (
    <div className="grid gap-6">
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <div className="mb-4">
          <BackToDiscovery />
        </div>

        <PhotoFallback />

        <h1 className="mt-5 text-2xl font-bold text-fg" style={{ maxWidth: '75ch' }}>
          {restaurant.name}
        </h1>

        {restaurant.description && (
          <p className="mt-2 text-sm text-muted" style={{ maxWidth: '70ch' }}>
            {restaurant.description}
          </p>
        )}

        <div className="mt-4">
          <CuisineTags tags={restaurant.cuisineTags} />
        </div>

        <div className="mt-4 space-y-2">
          <p className="text-sm text-fg">{restaurant.address}</p>

          {restaurant.phone && (
            <p className="text-sm text-fg">
              Telephone : {restaurant.phone}
            </p>
          )}

          {restaurant.website && (
            <p className="text-sm text-fg">
              Site web :{' '}
              <a
                href={restaurant.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                {restaurant.website}
              </a>
            </p>
          )}
        </div>

        <div className="mt-4">
          <RatingDisplay rating={restaurant.rating} />
        </div>

        {canManageRestaurant && (
          <div className="mt-5 grid gap-3 rounded-radius border border-border bg-soft/50 p-4">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setIsEditing((value) => !value)}
                className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Modifier le restaurant
              </button>
              <button
                type="button"
                onClick={() => setIsConfirmingDelete(true)}
                className="rounded-radius border border-danger/30 bg-danger/10 px-4 py-2 text-sm font-semibold text-danger transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Supprimer le restaurant
              </button>
            </div>

            {isEditing && (
              <form className="grid gap-3" onSubmit={handleEditSubmit}>
                <label className="grid gap-2 text-sm font-semibold text-fg" htmlFor="restaurant-name">
                  Nom du restaurant
                  <input
                    id="restaurant-name"
                    name="name"
                    type="text"
                    defaultValue={restaurant.name}
                    required
                    className="rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-fg" htmlFor="restaurant-description">
                  Description
                  <textarea
                    id="restaurant-description"
                    name="description"
                    defaultValue={restaurant.description ?? ''}
                    className="min-h-[80px] rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary"
                  />
                </label>
                <label className="grid gap-2 text-sm font-semibold text-fg" htmlFor="restaurant-address">
                  Adresse
                  <input
                    id="restaurant-address"
                    name="address"
                    type="text"
                    defaultValue={restaurant.address}
                    required
                    className="rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary"
                  />
                </label>
                <button
                  type="submit"
                  disabled={updateRestaurant.isPending}
                  className="w-fit rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                >
                  Enregistrer le restaurant
                </button>
              </form>
            )}

            {isConfirmingDelete && (
              <div className="grid gap-2 rounded-radius bg-danger/10 p-3">
                <p className="text-sm text-danger">La suppression retire ce restaurant des prochaines recherches.</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteRestaurant.isPending}
                    className="rounded-radius bg-danger px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
                  >
                    Confirmer la suppression du restaurant
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className="rounded-radius border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {(updateRestaurant.error || deleteRestaurant.error) && (
              <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
                {updateRestaurant.error?.message ?? deleteRestaurant.error?.message ?? 'Action impossible sur ce restaurant.'}
              </div>
            )}
          </div>
        )}

        {query.isRefetching && (
          <p role="status" className="mt-4 text-xs text-muted">Actualisation en cours...</p>
        )}

        {query.isError && (
          <div className="mt-4">
            <button
              type="button"
              onClick={handleRetry}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Reessayer
            </button>
          </div>
        )}
      </div>

      <div className="rounded-card bg-surface p-5 shadow-soft">
        <h2 className="text-lg font-bold text-fg mb-4">Avis</h2>
        {user && (
          <ReviewForm
            restaurantId={restaurant.id}
            sessionId={sessionId}
            isComplete={isComplete}
            currentUserId={user.id}
          />
        )}
        <div className="mt-4">
          <ReviewsList
            restaurantId={restaurant.id}
            currentUserId={user?.id}
          />
        </div>
      </div>
    </div>
  );
}
