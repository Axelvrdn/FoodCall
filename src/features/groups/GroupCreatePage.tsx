import { Link, useNavigate } from 'react-router-dom';
import { GroupForm } from './GroupForm';
import { Hero } from '@/components/ui';
import { ROUTES } from '@/lib';

export function GroupCreatePage() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-6">
      <Hero
        title="Créer un groupe"
        subtitle="Configure les paramètres par défaut de ton nouveau groupe."
      />
      <div className="rounded-card bg-surface p-5 shadow-soft">
        <GroupForm mode="create" onSuccess={(group) => navigate(`/groupes/${group.id}`)} />
      </div>
      <div className="text-center">
        <Link
          to={ROUTES.groups}
          className="text-sm text-primary hover:underline"
        >
          Retour aux groupes
        </Link>
      </div>
    </div>
  );
}
