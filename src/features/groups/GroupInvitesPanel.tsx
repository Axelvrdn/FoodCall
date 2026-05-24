import { useState } from 'react';
import { useCreateInviteMutation, useJoinGroupMutation } from './group-queries';
import { validateInviteCode } from '@/lib/validators';
import type { GroupInvite } from '@/types/api';

interface GroupInvitesPanelProps {
  groupId: string;
}

function formatInviteError(status: number): string {
  switch (status) {
    case 400:
      return "Code d'invitation invalide.";
    case 401:
      return 'Authentification requise pour rejoindre un groupe.';
    case 403:
      return "Vous n'avez pas la permission de rejoindre ce groupe.";
    case 404:
      return "Code d'invitation introuvable.";
    case 409:
      return 'Vous êtes déjà membre de ce groupe.';
    default:
      return 'Erreur lors de la tentative de rejoindre le groupe.';
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      const success = document.execCommand('copy');
      document.body.removeChild(textarea);
      return success;
    } catch {
      return false;
    }
  }
}

function InviteDisplay({ invite }: { invite: GroupInvite }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(invite.code);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const expiryDate = new Date(invite.expiresAt);
  const isExpired = expiryDate < new Date();

  return (
    <div className="grid gap-3 rounded-card bg-surface p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <code className="rounded bg-soft px-3 py-1.5 font-mono text-lg font-bold text-primary">
          {invite.code}
        </code>
        <button
          type="button"
          onClick={handleCopy}
          className="rounded-radius border border-border bg-surface px-3 py-1.5 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
        >
          {copied ? 'Copié' : 'Copier'}
        </button>
      </div>
      <div className="grid gap-1 text-sm text-muted">
        <p>
          Expire le :{' '}
          <span className="text-fg">
            {expiryDate.toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
          {isExpired && <span className="ml-2 text-danger">(expire)</span>}
        </p>
        <p>
          Utilisations :{' '}
          <span className="text-fg">
            {invite.currentUses}
            {invite.maxUses != null ? ` / ${invite.maxUses}` : ''}
          </span>
        </p>
      </div>
    </div>
  );
}

export function GroupInvitesPanel({ groupId }: GroupInvitesPanelProps) {
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinSuccess, setJoinSuccess] = useState(false);

  const createInviteMutation = useCreateInviteMutation();
  const joinMutation = useJoinGroupMutation();

  const createdInvite = createInviteMutation.data ?? null;

  const handleCreateInvite = () => {
    createInviteMutation.mutate(groupId);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError(null);
    setJoinSuccess(false);

    if (!/^[A-Z0-9]{8}$/.test(joinCode)) {
      setJoinError("Le code doit comporter exactement 8 caractères alphanumériques.");
      return;
    }

    if (!validateInviteCode(joinCode)) {
      setJoinError("Format de code d'invitation invalide.");
      return;
    }

    joinMutation.mutate(joinCode, {
      onSuccess: () => {
        setJoinSuccess(true);
        setJoinCode('');
      },
      onError: (err) => {
        setJoinError(formatInviteError(err.status));
      },
    });
  };

  return (
    <div className="grid gap-6">
      <section className="grid gap-4">
        <h3 className="text-lg font-bold text-fg">Inviter des membres</h3>
        <button
          type="button"
          onClick={handleCreateInvite}
          disabled={createInviteMutation.isPending}
          className="rounded-radius bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
        >
          {createInviteMutation.isPending ? 'Création...' : "Générer un code d'invitation"}
        </button>
        {createInviteMutation.isError && (
          <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
            {createInviteMutation.error?.message ?? "Erreur lors de la création de l'invitation."}
          </div>
        )}
        {createdInvite && <InviteDisplay invite={createdInvite} />}
      </section>

      <section className="grid gap-4">
        <h3 className="text-lg font-bold text-fg">Rejoindre un groupe</h3>
        <form onSubmit={handleJoin} className="grid gap-3">
          <div className="grid gap-2">
            <label htmlFor="join-code" className="text-sm font-semibold text-fg">
              Code d'invitation
            </label>
            <input
              id="join-code"
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              maxLength={8}
              className="w-full rounded-radius border border-border bg-surface px-4 py-2.5 text-sm text-fg outline-primary placeholder:text-muted"
              placeholder="ABCDEF12"
            />
          </div>
          {joinError && (
            <div role="alert" className="rounded bg-danger/10 p-3 text-sm text-danger">
              {joinError}
            </div>
          )}
          {joinSuccess && (
            <div role="status" className="rounded bg-success/10 p-3 text-sm text-success">
              Vous avez rejoint le groupe avec succès.
            </div>
          )}
          <button
            type="submit"
            disabled={joinMutation.isPending || joinCode.length !== 8}
            className="rounded-radius bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-50"
          >
            {joinMutation.isPending ? 'Connexion...' : 'Rejoindre'}
          </button>
        </form>
      </section>
    </div>
  );
}
