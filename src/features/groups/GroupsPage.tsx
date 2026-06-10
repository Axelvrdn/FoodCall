import { Link } from 'react-router-dom';
import { useInfiniteGroupsQuery } from '@/features/server-state';
import { canManageGroup, canCreateInvite } from './group-queries';
import { Hero } from '@/components/ui';
import { ROUTES } from '@/lib';
import { formatBudget } from '@/lib/formatters';
import type { GroupListItem } from '@/types/api';

function RoleBadge({ role }: { role: GroupListItem['role'] }) {
  const label = role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';
  const tone = role === 'owner' ? 'bg-primary text-white' : role === 'admin' ? 'bg-secondary text-fg' : 'bg-soft text-muted';
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

function groupRoute(template: string, groupId: string) {
  return template.replace(':id', groupId).replace(':groupId', groupId);
}

function GroupCard({ group }: { group: GroupListItem }) {
  return (
    <article className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-fg">{group.name}</h3>
          {group.description && <p className="mt-1 text-sm text-muted">{group.description}</p>}
        </div>
        <RoleBadge role={group.role} />
      </div>
      {group.budgetMax && (
        <p className="text-sm text-muted">
          Budget : <span className="font-mono font-semibold text-fg">{formatBudget(group.budgetMax)}</span>
        </p>
      )}
      <p className="text-xs text-muted">
        Les paramètres de départ, membres et sessions sont chargés depuis le détail backend du groupe.
      </p>
      <div className="flex flex-wrap gap-2">
        <Link
          to={groupRoute(ROUTES.groupDetail, group.id)}
          aria-label={`Ouvrir ${group.name}`}
          className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          Ouvrir
        </Link>
        {canManageGroup(group.role) && (
          <Link
            to={groupRoute(ROUTES.groupEdit, group.id)}
            aria-label={`Gérer ${group.name}`}
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Gérer
          </Link>
        )}
        {canCreateInvite(group.role) && (
          <Link
            to={groupRoute(ROUTES.groupInvites, group.id)}
            aria-label={`Inviter ${group.name}`}
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Inviter
          </Link>
        )}
      </div>
    </article>
  );
}

export function GroupsPage() {
  const {
    data: groupsPages,
    isLoading,
    error,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useInfiniteGroupsQuery(20);
  const groups = groupsPages?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="grid gap-6">
      <Hero
        title="Tes groupes décident mieux"
        subtitle="Groupes, votes en cours et historique de calls, sans adresse de départ dans le profil."
        actions={
          <>
            <Link
              to={ROUTES.groupCreate}
              className="rounded-full bg-white px-5 py-3 font-bold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Créer un groupe
            </Link>
            <Link
              to={ROUTES.groupJoin}
              className="rounded-full border border-white/70 px-5 py-3 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Rejoindre un groupe
            </Link>
          </>
        }
      />
      <section className="grid gap-4">
          {isLoading && <p role="status" className="text-sm text-muted">Chargement…</p>}
          {error && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              Impossible de charger les groupes. Veuillez réessayer.
            </div>
          )}
          {!isLoading && !error && groups.length === 0 && (
            <div className="rounded-card bg-surface p-5 shadow-soft text-center">
              <p className="text-muted">Aucun groupe pour le moment.</p>
              <div className="mt-4 flex justify-center gap-3">
                <Link
                  to={ROUTES.groupCreate}
                  className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Créer un groupe
                </Link>
                <Link
                  to={ROUTES.groupJoin}
                  className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Rejoindre un groupe
                </Link>
              </div>
            </div>
          )}
          {!isLoading && !error && groups.length > 0 && (
            <div className="grid gap-4 lg:grid-cols-2">
              {groups.map((group) => (
                <GroupCard key={group.id} group={group} />
              ))}
            </div>
          )}
          {!isLoading && !error && hasNextPage && (
            <button
              type="button"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              {isFetchingNextPage ? 'Chargement...' : 'Afficher plus'}
            </button>
          )}
      </section>
    </div>
  );
}
