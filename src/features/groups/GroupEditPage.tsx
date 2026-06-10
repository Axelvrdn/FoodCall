import { Link, useParams } from 'react-router-dom';
import { Hero } from '@/components/ui';
import { ROUTES } from '@/lib';
import { useGroupQuery } from './group-queries';
import { GroupForm } from './GroupForm';

export function GroupEditPage() {
  const { id } = useParams<{ id: string }>();
  const { data: group, isLoading, error } = useGroupQuery(id ?? '', { enabled: !!id });

  if (!id) {
    return <div role="alert" className="rounded bg-danger/10 p-4 text-danger">Identifiant de groupe manquant.</div>;
  }

  return (
    <div className="grid gap-6">
      <Hero title="Gérer le groupe" subtitle="Modifie les paramètres persistés par l'API FoodCall." />
      {isLoading && <p role="status" className="text-sm text-muted">Chargement du groupe...</p>}
      {error && <div role="alert" className="rounded bg-danger/10 p-4 text-danger">Impossible de charger le groupe.</div>}
      {group && (
        <div className="rounded-card bg-surface p-5 shadow-soft">
          <GroupForm mode="edit" group={group} />
        </div>
      )}
      <Link to={ROUTES.groups} className="text-sm font-semibold text-primary hover:underline">
        Retour aux groupes
      </Link>
    </div>
  );
}
