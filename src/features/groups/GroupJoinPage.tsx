import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Hero } from '@/components/ui';
import { ROUTES } from '@/lib';
import { validateInviteCode } from '@/lib/validators';
import { useJoinGroupMutation } from './group-queries';

function formatJoinError(status: number): string {
  switch (status) {
    case 400:
      return "Code d'invitation invalide.";
    case 401:
      return 'Connexion requise pour rejoindre ce groupe.';
    case 403:
      return "Vous n'avez pas la permission de rejoindre ce groupe.";
    case 404:
      return "Code d'invitation introuvable.";
    case 409:
      return 'Vous êtes déjà membre de ce groupe.';
    default:
      return 'Impossible de rejoindre ce groupe.';
  }
}

export function GroupJoinPage() {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const joinMutation = useJoinGroupMutation();
  const navigate = useNavigate();

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const normalizedCode = code.trim().toUpperCase();
    setError(null);

    if (!validateInviteCode(normalizedCode)) {
      setError('Le code doit comporter exactement 8 caractères alphanumériques.');
      return;
    }

    joinMutation.mutate(normalizedCode, {
      onSuccess: (member) => navigate(`/groupes/${member.groupId}`),
      onError: (err) => setError(formatJoinError(err.status)),
    });
  };

  return (
    <div className="grid gap-6">
      <Hero
        title="Rejoindre un groupe"
        subtitle="Entre un code d'invitation backend pour ajouter ce groupe à tes groupes."
      />
      <section className="rounded-card bg-surface p-5 shadow-soft">
        <form onSubmit={handleSubmit} className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="join-code" className="text-sm font-semibold text-fg">
              Code d'invitation
            </label>
            <input
              id="join-code"
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              maxLength={8}
              className="w-full rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary placeholder:text-muted"
              placeholder="ABCDEF12"
            />
          </div>
          {error && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              {error}
            </div>
          )}
          {joinMutation.error && !error && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              {formatJoinError(joinMutation.error.status)}
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={joinMutation.isPending}
              className="rounded-radius bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
            >
              {joinMutation.isPending ? 'Connexion...' : 'Rejoindre le groupe'}
            </button>
            <Link to={ROUTES.groups} className="rounded-radius border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-fg">
              Retour aux groupes
            </Link>
          </div>
        </form>
      </section>
    </div>
  );
}
