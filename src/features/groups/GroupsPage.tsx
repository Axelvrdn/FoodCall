import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useInfiniteGroupsQuery, useGroupQuery } from '@/features/server-state';
import { canManageGroup, canCreateInvite } from './group-queries';
import { Hero } from '@/components/ui';
import { formatBudget, formatDistance } from '@/lib/formatters';
import type { GroupListItem, Group } from '@/types/api';

function RoleBadge({ role }: { role: GroupListItem['role'] }) {
  const label = role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';
  const tone = role === 'owner' ? 'bg-primary text-white' : role === 'admin' ? 'bg-secondary text-fg' : 'bg-soft text-muted';
  return <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${tone}`}>{label}</span>;
}

function GroupCard({ group, onSelect }: { group: GroupListItem; onSelect: (id: string) => void }) {
  return (
    <article className="rounded-card bg-surface p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-fg">{group.name}</h3>
          {group.description && <p className="mt-1 text-sm text-muted">{group.description}</p>}
        </div>
        <RoleBadge role={group.role} />
      </div>
      {group.budgetMax && (
        <p className="mt-3 text-sm text-muted">
          Budget : <span className="font-mono font-semibold text-fg">{formatBudget(group.budgetMax)}</span>
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        {canManageGroup(group.role) && (
          <>
            <Link
              to={`/groupes/${group.id}`}
              aria-label={`Ouvrir ${group.name}`}
              className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Ouvrir
            </Link>
            <button
              type="button"
              onClick={() => onSelect(group.id)}
              className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
            >
              Gérer
            </button>
          </>
        )}
        {canCreateInvite(group.role) && (
          <button
            type="button"
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Inviter
          </button>
        )}
      </div>
    </article>
  );
}

function GroupDetail({ group }: { group: Group }) {
  return (
    <div className="mt-4 rounded-card bg-surface p-5 shadow-soft">
      <h4 className="font-bold text-fg">Paramètres par défaut</h4>
      {group.defaultStartAddress && (
        <p className="mt-2 text-sm text-muted">
          Départ : <span className="text-fg">{group.defaultStartAddress}</span>
        </p>
      )}
      {group.defaultSearchRadiusMeters != null && (
        <p className="mt-1 text-sm text-muted">
          Rayon de recherche : <span className="text-fg">{formatDistance(group.defaultSearchRadiusMeters)}</span>
        </p>
      )}
      {group.budgetMax && (
        <p className="mt-1 text-sm text-muted">
          Budget : <span className="font-mono font-semibold text-fg">{formatBudget(group.budgetMax)}</span>
        </p>
      )}
    </div>
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data: selectedGroup } = useGroupQuery(selectedId ?? '');

  const groups = groupsPages?.pages.flatMap((page) => page.data) ?? [];

  return (
    <div className="grid gap-6">
      <Hero
        title="Tes groupes décident mieux"
        subtitle="Groupes, votes en cours et historique de calls, sans adresse de départ dans le profil."
      />
      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-4">
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
                <button
                  type="button"
                  className="rounded-radius bg-primary px-4 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Créer un groupe
                </button>
                <button
                  type="button"
                  className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
                >
                  Rejoindre un groupe
                </button>
              </div>
            </div>
          )}
          {!isLoading && !error && groups.map((group) => (
            <GroupCard key={group.id} group={group} onSelect={setSelectedId} />
          ))}
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
        </div>
        <aside>
          {selectedGroup && <GroupDetail group={selectedGroup} />}
        </aside>
      </section>
    </div>
  );
}
