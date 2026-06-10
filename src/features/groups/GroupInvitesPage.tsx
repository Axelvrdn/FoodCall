import { Link, useParams } from 'react-router-dom';
import { Hero } from '@/components/ui';
import { ROUTES } from '@/lib';
import { useGroupQuery } from './group-queries';
import { GroupInvitesPanel } from './GroupInvitesPanel';

export function GroupInvitesPage() {
  const { id } = useParams<{ id: string }>();
  const { data: group, isLoading, error } = useGroupQuery(id ?? '', { enabled: !!id });

  if (!id) {
    return <div role="alert" className="rounded bg-danger/10 p-4 text-danger">Identifiant de groupe manquant.</div>;
  }

  return (
    <div className="grid gap-6">
      <Hero title="Inviter au groupe" subtitle="Génère un code d'invitation backend pour ce groupe." />
      {isLoading && <p role="status" className="text-sm text-muted">Chargement du groupe...</p>}
      {error && <div role="alert" className="rounded bg-danger/10 p-4 text-danger">Impossible de charger le groupe.</div>}
      {group && (
        <section className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
          <h2 className="text-lg font-bold text-fg">{group.name}</h2>
          <GroupInvitesPanel groupId={group.id} />
        </section>
      )}
      <Link to={ROUTES.groups} className="text-sm font-semibold text-primary hover:underline">
        Retour aux groupes
      </Link>
    </div>
  );
}
