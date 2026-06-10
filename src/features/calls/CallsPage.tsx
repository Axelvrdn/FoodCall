import { Link } from 'react-router-dom';
import { BadgeCard, Hero } from '@/components/ui';
import { ROUTES } from '@/lib';

export function CallsPage() {
  return (
    <div className="grid gap-6">
      <Hero
        title="Mes calls"
        subtitle="Tes recommandations et ton score de réputation."
      />
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
        <main className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
          <div className="grid gap-2">
            <p className="text-sm font-semibold text-fg">Aucun endpoint utilisateur ne liste encore tes calls.</p>
            <p className="text-sm text-muted">
              Les calls utilisateur seront disponibles lorsque le backend fournira un endpoint de liste par utilisateur. Pour l’instant, FoodCall expose les calls depuis les sessions de groupe.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to={ROUTES.groups}
              className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Voir mes groupes
            </Link>
            <Link
              to={ROUTES.discover}
              className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-bold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Découvrir des restaurants
            </Link>
          </div>
        </main>
        <aside className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
          <div className="rounded-card border border-border bg-surface-warm p-5 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Score non calculé</p>
            <p className="mt-2 text-sm text-muted">Le score sera calculé quand l’API exposera l’historique utilisateur.</p>
          </div>
          <BadgeCard
            icon="FC"
            title="Badge en attente"
            subtitle="Aucun badge de gamification n’est affiché tant que le backend ne fournit pas de score utilisateur."
          />
        </aside>
      </section>
    </div>
  );
}
