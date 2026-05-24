import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SettingsLayout } from '@/components/layouts';
import { Hero } from '@/components/ui';
import { ROUTES, validatePassword } from '@/lib';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';
import type { NormalizedApiError } from '@/services/api-client';

const SETTINGS_SECTIONS = [
  'Informations du compte',
  'Confidentialité',
  'Sécurité',
  "Préférences d'affichage",
] as const;

export function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Hero
        title="Paramètres"
        subtitle="Compte, sécurité, confidentialité et affichage."
      />
      <SettingsLayout>
        <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <article
            id="informations-du-compte"
            className="rounded-card bg-surface p-5 shadow-soft"
          >
            <h2 className="text-xl font-bold text-fg">Informations du compte</h2>
            <p className="mt-2 text-sm text-muted">
              Mise à jour du profil et de l'email à venir.
            </p>
          </article>

          <article
            id="confidentialite"
            className="rounded-card bg-surface p-5 shadow-soft"
          >
            <h2 className="text-xl font-bold text-fg">Confidentialité</h2>
            <p className="mt-2 text-sm text-muted">
              Paramètres de confidentialité à venir.
            </p>
          </article>

          <article
            id="securite"
            className="rounded-card bg-surface p-5 shadow-soft md:col-span-2 lg:col-span-1"
          >
            <h2 className="text-xl font-bold text-fg">Sécurité</h2>
            <ChangePasswordForm />
          </article>

          <article
            id="preferences-daffichage"
            className="rounded-card bg-surface p-5 shadow-soft"
          >
            <h2 className="text-xl font-bold text-fg">
              Préférences d&apos;affichage
            </h2>
            <p className="mt-2 text-sm text-muted">
              Options d&apos;affichage à venir.
            </p>
          </article>
        </section>
      </SettingsLayout>
    </div>
  );
}

function ChangePasswordForm() {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordErrors([]);
    setFormError(null);

    const result = validatePassword(newPassword);
    if (!result.valid) {
      setPasswordErrors(result.errors);
      return;
    }

    setIsPending(true);
    try {
      await authService.changePassword({
        currentPassword,
        newPassword,
      });
      useAuthStore.getState().logout();
      queryClient.clear();
      navigate(ROUTES.login);
    } catch (err) {
      const normalized = err as NormalizedApiError;
      if (normalized?.status === 401) {
        setFormError('Mot de passe actuel incorrect.');
        setIsPending(false);
      } else {
        setFormError('Erreur lors du changement de mot de passe. Réessaie plus tard.');
        setIsPending(false);
      }
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-4 grid gap-4">
      <div className="grid gap-2">
        <label htmlFor="settings-currentPassword" className="text-sm font-semibold text-fg">
          Mot de passe actuel
        </label>
        <input
          id="settings-currentPassword"
          name="currentPassword"
          type="password"
          required
          autoComplete="current-password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>
      <div className="grid gap-2">
        <label htmlFor="settings-newPassword" className="text-sm font-semibold text-fg">
          Nouveau mot de passe
        </label>
        <input
          id="settings-newPassword"
          name="newPassword"
          type="password"
          required
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
        {passwordErrors.length > 0 && (
          <p role="alert" className="text-sm text-danger">
            Mot de passe : {passwordErrors.join(', ')}
          </p>
        )}
      </div>
      <p className="text-xs text-muted">
        Toutes vos sessions seront déconnectées après le changement de mot de passe.
      </p>
      {formError && (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={isPending}
        aria-disabled={isPending}
        className="rounded-full bg-primary px-5 py-3 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? 'Changement…' : 'Changer le mot de passe'}
      </button>
    </form>
  );
}

export { SETTINGS_SECTIONS };