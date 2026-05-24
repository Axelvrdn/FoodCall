import { useState } from 'react';
import { Hero, StatCard } from '@/components/ui';
import { ReviewsList } from '@/components/ReviewsList';
import { useRestaurantDetailQuery, useRestaurantsSearchQuery } from '@/features/discover/discovery-queries';
import type { Restaurant } from '@/types/api';

export function ReviewsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const trimmedQuery = searchQuery.trim();

  const search = useRestaurantsSearchQuery(trimmedQuery, undefined, 5, {
    enabled: trimmedQuery.length >= 2,
  });
  const selectedDetail = useRestaurantDetailQuery(selectedRestaurant?.id ?? '', {
    enabled: !!selectedRestaurant,
  });
  const activeRestaurant = selectedDetail.data ?? selectedRestaurant;
  const rating = activeRestaurant?.rating;

  return (
    <div className="grid gap-6">
      <Hero
        title="Avis de la communauté"
        subtitle="Le flux global des avis attend un endpoint backend dédié. En attendant, consulte les avis réels par restaurant."
      />
      <section className="grid gap-6 lg:grid-cols-[0.8fr_1.4fr_0.8fr]">
        <aside className="rounded-card bg-surface p-5 shadow-soft">
          <h2 className="text-lg font-bold text-fg">Explorer les avis</h2>
          <p className="mt-2 text-sm text-muted">
            Aucun endpoint backend global n'est documenté pour les avis. Cette page reste donc scindée par restaurant au lieu de fabriquer un faux flux global.
          </p>
          <label className="mt-5 grid gap-2 text-sm font-semibold text-fg" htmlFor="reviews-restaurant-search">
            Rechercher un restaurant
            <input
              id="reviews-restaurant-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Ex. marcel"
              className="rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary"
            />
          </label>
          {search.isLoading && <p role="status" className="mt-3 text-sm text-muted">Recherche en cours...</p>}
          {search.error && (
            <div role="alert" className="mt-3 rounded bg-danger/10 p-3 text-sm text-danger">
              Impossible de rechercher les restaurants.
            </div>
          )}
          <div className="mt-4 grid gap-2">
            {search.data?.data.map((restaurant) => (
              <button
                key={restaurant.id}
                type="button"
                aria-label={`Consulter les avis de ${restaurant.name}`}
                onClick={() => setSelectedRestaurant(restaurant)}
                className="rounded-radius border border-border bg-surface px-4 py-3 text-left text-sm transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                <span className="block font-semibold text-fg">{restaurant.name}</span>
                <span className="block text-xs text-muted">{restaurant.address}</span>
              </button>
            ))}
          </div>
        </aside>

        <main className="grid gap-4">
          {activeRestaurant ? (
            <section className="grid gap-4">
              <article className="rounded-card bg-surface p-5 shadow-soft">
                <h2 className="text-xl font-bold text-fg">{activeRestaurant.name}</h2>
                <p className="mt-2 text-sm text-muted">{activeRestaurant.address}</p>
                {rating && rating.count > 0 ? (
                  <p className="mt-3 text-sm text-muted">
                    Note backend : <span className="font-semibold text-fg">{(rating.average ?? 0).toFixed(1)}</span> sur 5 ({rating.count} avis)
                  </p>
                ) : (
                  <p className="mt-3 text-sm text-muted">Aucune note backend pour ce restaurant.</p>
                )}
              </article>
              <ReviewsList restaurantId={activeRestaurant.id} />
            </section>
          ) : (
            <article className="rounded-card bg-surface p-5 shadow-soft">
              <h2 className="text-xl font-bold text-fg">Avis réels par restaurant</h2>
              <p className="mt-2 text-sm text-muted">
                Sélectionne un restaurant pour charger ses avis depuis l'endpoint restaurant-scoped du backend.
              </p>
            </article>
          )}
        </main>

        <aside className="grid gap-4 self-start">
          <StatCard value="Scoped" label="Endpoint reviews" />
          <StatCard value="À prévoir" label="Flux global" />
        </aside>
      </section>
    </div>
  );
}
