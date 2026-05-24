import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import {
  useGroupQuery,
  useGroupMembersQuery,
  canManageGroup,
} from './group-queries';
import {
  useGroupSessionsQuery,
  useRemoveGroupMemberMutation,
  useUpdateGroupMemberRoleMutation,
} from '@/features/server-state';
import { GroupForm } from './GroupForm';
import { GroupInvitesPanel } from './GroupInvitesPanel';
import { formatBudget, formatDistance, formatDate } from '@/lib/formatters';
import type { GroupMember, GroupRole } from '@/types/api';

function RoleBadge({ role }: { role: GroupMember['role'] }) {
  const label = role === 'owner' ? 'Propriétaire' : role === 'admin' ? 'Admin' : 'Membre';
  const tone =
    role === 'owner'
      ? 'bg-primary text-white'
      : role === 'admin'
        ? 'bg-secondary text-fg'
        : 'bg-soft text-muted';
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold ${tone}`}>
      {label}
    </span>
  );
}

type MemberRowProps = {
  member: GroupMember;
  canManageMembers: boolean;
  isCurrentUser: boolean;
  onRoleChange: (userId: string, role: GroupRole) => void;
  onRemove: (userId: string) => void;
  rolePending: boolean;
  removePending: boolean;
};

function MemberRow({
  member,
  canManageMembers,
  isCurrentUser,
  onRoleChange,
  onRemove,
  rolePending,
  removePending,
}: MemberRowProps) {
  const [selectedRole, setSelectedRole] = useState<GroupRole>(member.role);
  const [confirmRemoval, setConfirmRemoval] = useState(false);
  const displayName = member.user?.displayName ?? 'Utilisateur';
  const canEditMember = canManageMembers && !isCurrentUser && member.role !== 'owner';

  return (
    <div
      role="group"
      aria-label={`Membre ${displayName}`}
      className="grid gap-4 rounded-card border border-border bg-surface p-4 shadow-soft lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center"
    >
      <div className="flex min-w-0 items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-white">
          {member.user?.displayName?.[0] ?? '?'}
        </div>
        <div className="min-w-0">
          <p className="break-words font-semibold text-fg">{displayName}</p>
          <p className="break-all text-xs text-muted">{member.user?.email ?? ''}</p>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 lg:justify-end">
        <RoleBadge role={member.role} />
        {canEditMember && (
          <>
            <label className="sr-only" htmlFor={`member-role-${member.userId}`}>
              Rôle de {displayName}
            </label>
            <select
              id={`member-role-${member.userId}`}
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as GroupRole)}
              className="rounded-radius border border-border bg-surface px-3 py-2 text-sm text-fg outline-primary"
            >
              <option value="admin">Admin</option>
              <option value="member">Membre</option>
            </select>
            <button
              type="button"
              onClick={() => onRoleChange(member.userId, selectedRole)}
              disabled={rolePending || selectedRole === member.role}
              aria-label={`Mettre à jour le rôle de ${displayName}`}
              className="rounded-radius bg-primary px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              Mettre à jour
            </button>
            {confirmRemoval ? (
              <button
                type="button"
                onClick={() => onRemove(member.userId)}
                disabled={removePending}
                aria-label={`Confirmer le retrait de ${displayName}`}
                className="rounded-radius bg-danger px-3 py-2 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
              >
                Confirmer le retrait
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmRemoval(true)}
                aria-label={`Retirer ${displayName}`}
                className="rounded-radius border border-danger/30 bg-danger/10 px-3 py-2 text-sm font-semibold text-danger transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Retirer
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function GroupDefaults({ group }: { group: NonNullable<ReturnType<typeof useGroupQuery>['data']> }) {
  return (
    <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
      <h4 className="font-bold text-fg">Paramètres par défaut</h4>
      {group.defaultStartAddress ? (
        <p className="text-sm text-muted">
          Départ : <span className="text-fg">{group.defaultStartAddress}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">Aucune adresse de départ définie.</p>
      )}
      {group.defaultStartLatitude != null && group.defaultStartLongitude != null && (
        <p className="text-sm text-muted">
          Coordonnées :{' '}
          <span className="font-mono text-fg">
            {group.defaultStartLatitude}, {group.defaultStartLongitude}
          </span>
        </p>
      )}
      {group.defaultSearchRadiusMeters != null ? (
        <p className="text-sm text-muted">
          Rayon : <span className="text-fg">{formatDistance(group.defaultSearchRadiusMeters)}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">Aucun rayon de recherche défini.</p>
      )}
      {group.budgetMax ? (
        <p className="text-sm text-muted">
          Budget : <span className="font-mono font-semibold text-fg">{formatBudget(group.budgetMax)}</span>
        </p>
      ) : (
        <p className="text-sm text-muted">Aucun budget maximum défini.</p>
      )}
    </div>
  );
}

function RecentSessions({ groupId }: { groupId: string }) {
  const { data: sessionsPage, isLoading, error } = useGroupSessionsQuery(groupId, undefined, 5);
  const sessions = sessionsPage?.data ?? [];

  if (isLoading) {
    return <p className="text-sm text-muted">Chargement des sessions...</p>;
  }

  if (error) {
    return (
      <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
        Impossible de charger les sessions.
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="rounded-card bg-surface p-5 shadow-soft text-center">
        <p className="text-sm text-muted">Aucune session pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="flex items-start justify-between gap-3 rounded-card bg-surface p-4 shadow-soft"
        >
          <div className="min-w-0">
            <p className="font-semibold text-fg">{session.name}</p>
            {session.description && (
              <p className="mt-0.5 text-sm text-muted">{session.description}</p>
            )}
            <p className="mt-1 text-xs text-muted capitalize">{session.status}</p>
          </div>
          <span className="shrink-0 text-xs text-muted">{formatDate(session.createdAt)}</span>
        </div>
      ))}
    </div>
  );
}

export function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const user = useAuthStore((s) => s.user);

  const {
    data: group,
    isLoading: groupLoading,
    error: groupError,
  } = useGroupQuery(id ?? '', { enabled: !!id });

  const {
    data: members,
    isLoading: membersLoading,
    error: membersError,
  } = useGroupMembersQuery(id ?? '', { enabled: !!id });

  const currentMember = members?.find((m) => m.userId === user?.id);
  const userRole = currentMember?.role ?? null;
  const canManage = userRole ? canManageGroup(userRole) : false;
  const canManageMembers = userRole === 'owner';
  const updateMemberRole = useUpdateGroupMemberRoleMutation(id ?? '');
  const removeMember = useRemoveGroupMemberMutation(id ?? '');
  const [memberStatus, setMemberStatus] = useState<string | null>(null);

  if (!id) {
    return (
      <div className="grid gap-6">
        <div role="alert" className="rounded bg-danger/10 p-4 text-danger">
          Identifiant de groupe manquant.
        </div>
      </div>
    );
  }

  if (groupLoading || membersLoading) {
    return (
      <div className="grid gap-6">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" className="text-sm text-muted">Chargement du groupe...</p>
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
            ? "Ce groupe n'existe pas ou a été supprimé."
            : 'Impossible de charger le groupe. Veuillez réessayer.'}
        </div>
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

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-bold text-fg">{group.name}</h1>
        {group.description && <p className="text-muted max-w-[75ch]">{group.description}</p>}
      </header>

      <section className="grid gap-6 lg:grid-cols-[1fr_1fr]">
        <div className="grid gap-6">
          <GroupDefaults group={group} />

          <div className="grid gap-3">
            <h2 className="text-lg font-bold text-fg">Membres</h2>
            {membersError ? (
              <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
                Impossible de charger les membres.
              </div>
            ) : !members || members.length === 0 ? (
              <div className="rounded-card bg-surface p-5 shadow-soft text-center">
                <p className="text-sm text-muted">Aucun membre.</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {members.map((member) => (
                  <MemberRow
                    key={member.id}
                    member={member}
                    canManageMembers={canManageMembers}
                    isCurrentUser={member.userId === user?.id}
                    rolePending={updateMemberRole.isPending}
                    removePending={removeMember.isPending}
                    onRoleChange={(userId, role) => {
                      const displayName = member.user?.displayName ?? 'Ce membre';
                      setMemberStatus(null);
                      updateMemberRole.mutate({ userId, role }, {
                        onSuccess: () => setMemberStatus(`Rôle de ${displayName} mis à jour.`),
                      });
                    }}
                    onRemove={(userId) => {
                      const displayName = member.user?.displayName ?? 'Ce membre';
                      setMemberStatus(null);
                      removeMember.mutate(userId, {
                        onSuccess: () => setMemberStatus(`${displayName} retiré du groupe.`),
                      });
                    }}
                  />
                ))}
              </div>
            )}
            {memberStatus && (
              <div role="status" className="rounded bg-primary/10 p-3 text-sm font-semibold text-primary">
                {memberStatus}
              </div>
            )}
            {(updateMemberRole.error || removeMember.error) && (
              <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
                {updateMemberRole.error?.message ?? removeMember.error?.message ?? 'Impossible de modifier ce membre.'}
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6">
          {canManage && (
            <>
              <div className="grid gap-3">
                <h2 className="text-lg font-bold text-fg">Modifier le groupe</h2>
                <div className="rounded-card bg-surface p-5 shadow-soft">
                  <GroupForm mode="edit" group={group} />
                </div>
              </div>

              <div className="grid gap-3">
                <h2 className="text-lg font-bold text-fg">Invitations</h2>
                <div className="rounded-card bg-surface p-5 shadow-soft">
                  <GroupInvitesPanel groupId={group.id} />
                </div>
              </div>
            </>
          )}

          <div className="grid gap-3">
            <h2 className="text-lg font-bold text-fg">Recommandations</h2>
            <div className="rounded-card bg-surface p-5 shadow-soft">
              <p className="text-sm text-muted mb-3">
                Decouvrez les restaurants recommandes a proximite en fonction de la qualite, distance, budget et historique du groupe.
              </p>
              <Link
                to={`/groupes/${group.id}/recommendations`}
                className="text-sm font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
              >
                Voir les recommandations
              </Link>
            </div>
          </div>

          <div className="grid gap-3">
            <h2 className="text-lg font-bold text-fg">Sessions récentes</h2>
            <RecentSessions groupId={group.id} />
          </div>
        </div>
      </section>
    </div>
  );
}
