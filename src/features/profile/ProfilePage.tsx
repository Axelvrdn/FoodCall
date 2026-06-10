import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FoodCallAnimatedBackground } from '@/components/ui';
import { useCurrentUserQuery } from '@/features/auth/auth-queries';
import { ROUTES } from '@/lib';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/api';

const PROFILE_TABS = ['Aperçu', 'Avis', 'Calls', 'Favoris', 'Groupes', 'Badges'] as const;

export function ProfilePage() {
  const storedUser = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const currentUserQuery = useCurrentUserQuery();
  const user = currentUserQuery.data ?? storedUser;

  useEffect(() => {
    if (currentUserQuery.data) setUser(currentUserQuery.data);
  }, [currentUserQuery.data, setUser]);

  const identityLabel = user?.displayName?.trim() || user?.email || 'Profil FoodCall';

  return (
    <div className="grid min-w-0 gap-8">
      <section className="min-w-0 rounded-card bg-surface shadow-card">
        <div className="relative h-40 overflow-hidden rounded-t-card bg-primary-gradient md:h-48">
          <FoodCallAnimatedBackground variant="profile" />
        </div>
        <div className="px-4 pb-6 sm:px-6 md:px-8 md:pb-8">
          <div
            data-testid="profile-identity-card"
            className="relative z-10 -mt-12 flex min-w-0 flex-col gap-5 rounded-3xl border border-border/70 bg-surface/95 p-4 shadow-soft md:-mt-14 md:flex-row md:items-end md:justify-between md:p-5"
          >
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end">
              <ProfileAvatar user={user} identityLabel={identityLabel} />
              <div className="min-w-0 pb-1">
                <p className="font-mono text-xs uppercase tracking-[0.22em] text-primary">Profil communautaire</p>
                <h1 className="mt-2 break-words font-display text-4xl leading-tight text-fg md:text-5xl">{identityLabel}</h1>
                {user ? (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm font-semibold text-muted">
                    <span className="break-all">{user.email}</span>
                    <span aria-hidden="true">•</span>
                    <span>{formatJoinedDate(user.createdAt)}</span>
                  </div>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-muted">Connexion requise pour afficher les données /users/me.</p>
                )}
              </div>
            </div>

            <Link
              to={ROUTES.settings}
              className="inline-flex w-fit items-center justify-center rounded-full border border-border bg-surface px-5 py-3 text-sm font-bold text-fg shadow-soft transition-transform duration-150 ease-out hover:-translate-y-0.5 hover:bg-surface-warm active:scale-[0.98]"
            >
              Paramètres du compte
            </Link>
          </div>

          <p className="mt-6 max-w-3xl text-base leading-7 text-muted">
            Cette page présente ton identité FoodCall et les signaux sociaux réellement disponibles. Les sections sans contrat backend restent visibles comme états honnêtes, sans faux badge ni fausse activité.
          </p>
        </div>
      </section>

      <section aria-label="Statistiques sociales disponibles" className="grid min-w-0 gap-4 md:grid-cols-3">
        <ProfileStat value={user ? user.reputationScore.toLocaleString('fr-FR') : '—'} label="Réputation" helper="Score renvoyé par /users/me" />
        <ProfileStat value="—" label="Avis publiés" helper="Endpoint non disponible" />
        <ProfileStat value="—" label="Calls lancés" helper="Endpoint non disponible" />
      </section>

      <section className="min-w-0 rounded-card bg-surface p-5 shadow-soft md:p-6">
        <nav aria-label="Sections du profil" className="max-w-full overflow-x-auto">
          <div className="flex min-w-max gap-2 rounded-2xl bg-surface-warm p-1">
            {PROFILE_TABS.map((tab, index) => (
              <button
                key={tab}
                type="button"
                className={`rounded-full px-4 py-2 text-sm font-bold transition-colors duration-150 ${index === 0 ? 'bg-surface text-primary shadow-soft' : 'text-muted hover:bg-surface hover:text-fg'}`}
                aria-pressed={index === 0}
              >
                {tab}
              </button>
            ))}
          </div>
        </nav>

        <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <article className="rounded-3xl border border-border bg-surface-warm p-6">
            <h2 className="font-display text-2xl text-fg">Aperçu public</h2>
            <p className="mt-3 leading-7 text-muted">
              FoodCall expose aujourd’hui l’identité de compte, l’avatar, les dates de profil et le score de réputation. Les avis, favoris, groupes publics et calls personnels nécessitent encore des endpoints dédiés avant d’être affichés comme données réelles.
            </p>
            <dl className="mt-6 grid gap-3 text-sm">
              <ProfileFact label="Identifiant utilisateur" value={user?.id ?? 'Indisponible'} />
              <ProfileFact label="Dernière mise à jour" value={user ? formatFullDate(user.updatedAt) : 'Indisponible'} />
            </dl>
          </article>

          <article className="rounded-3xl border border-border bg-surface-warm p-6">
            <h2 className="font-display text-2xl text-fg">Aucun badge affiché</h2>
            <p className="mt-3 text-sm leading-6 text-muted">
              FoodCall n’expose pas encore d’endpoint public pour les badges. Cette zone reste volontairement vide pour éviter un faux statut communautaire.
            </p>
          </article>
        </div>
      </section>

      <section className="min-w-0 rounded-card border border-border bg-surface p-6 shadow-soft">
        <h2 className="font-display text-2xl text-fg">Photo de profil</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
          Le changement d’avatar est désactivé ici pour éviter une modification non vérifiée depuis cette surface sociale. Les actions privées restent centralisées dans les paramètres quand elles sont validées par le backend.
        </p>
        <button
          type="button"
          disabled
          className="mt-4 rounded-full bg-soft px-5 py-2.5 text-sm font-bold text-muted disabled:cursor-not-allowed disabled:opacity-70"
        >
          Changer la photo
        </button>
      </section>
    </div>
  );
}

function ProfileAvatar({ user, identityLabel }: { user: User | null | undefined; identityLabel: string }) {
  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt={`Photo de profil de ${identityLabel}`}
        className="h-24 w-24 rounded-3xl border-4 border-surface object-cover shadow-card md:h-28 md:w-28"
      />
    );
  }

  return (
    <div className="flex h-24 w-24 items-center justify-center rounded-3xl border-4 border-surface bg-primary text-3xl font-black text-white shadow-card md:h-28 md:w-28">
      {initialsFor(identityLabel)}
    </div>
  );
}

function ProfileStat({ value, label, helper }: { value: string; label: string; helper: string }) {
  return (
    <article className="rounded-card bg-surface p-5 shadow-soft">
      <p className="font-mono text-3xl font-bold text-primary">{value}</p>
      <h2 className="mt-1 text-sm font-bold text-fg">{label}</h2>
      <p className="mt-2 text-xs font-semibold text-muted">{helper}</p>
    </article>
  );
}

function ProfileFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-2xl bg-surface px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="font-semibold text-muted">{label}</dt>
      <dd className="break-all font-mono text-fg sm:max-w-[62%] sm:text-right">{value}</dd>
    </div>
  );
}

function initialsFor(label: string): string {
  const initials = label
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
  return initials || 'P';
}

function formatJoinedDate(value: string): string {
  return `Membre depuis ${new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(new Date(value))}`;
}

function formatFullDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(value));
}
