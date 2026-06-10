import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Hero } from '@/components/ui';
import { ROUTES, validatePassword } from '@/lib';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';
import type { NormalizedApiError } from '@/services/api-client';

const SETTINGS_SECTIONS = [
  'Compte',
  'Profil',
  'Préférences alimentaires',
  'Notifications',
  'Confidentialité',
  'Sécurité',
  'Apparence / affichage',
] as const;

const SETTINGS_COPY: Record<typeof SETTINGS_SECTIONS[number], string> = {
  Compte: 'Identité de connexion et accès au compte. Les changements persistants se font depuis le profil quand l’API les prend en charge.',
  Profil: 'Nom affiché, e-mail et avatar sont gérés dans la page Profil avec les endpoints /users/me documentés.',
  'Préférences alimentaires': 'Aucun endpoint ne persiste encore les préférences alimentaires. Cette section reste informative jusqu’au contrat backend dédié.',
  Notifications: 'Aucun endpoint de notifications n’est disponible. Les préférences ne sont donc pas éditables ici.',
  Confidentialité: 'Aucun endpoint ne modifie encore la confidentialité. Les options seront activées quand le backend exposera ces réglages.',
  Sécurité: 'Change ton mot de passe avec le endpoint backend dédié. Une réussite déconnecte la session locale.',
  'Apparence / affichage': 'Les préférences d’affichage restent locales à définir et ne sont pas persistées par l’API actuelle.',
};

function sectionId(section: typeof SETTINGS_SECTIONS[number]) {
  return section
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function SettingsPage() {
  return (
    <div className="grid gap-6">
      <Hero
        title="Paramètres"
        subtitle="Compte, sécurité, confidentialité et affichage."
      />
      <div className="grid items-start gap-8 lg:grid-cols-[18rem_minmax(0,1fr)]">
        <nav aria-label="Sections des paramètres" className="rounded-card bg-surface p-4 shadow-soft lg:sticky lg:top-28 lg:self-start">
          <div className="grid gap-2">
            {SETTINGS_SECTIONS.map((section) => (
              <a
                key={section}
                href={`#${sectionId(section)}`}
                className="rounded-2xl px-3 py-2 text-sm font-semibold text-muted transition-colors duration-150 hover:bg-surface-warm hover:text-fg"
              >
                {section}
              </a>
            ))}
          </div>
        </nav>

        <section className="grid gap-6">
          {SETTINGS_SECTIONS.map((section) => (
            <article
              key={section}
              id={sectionId(section)}
              className="scroll-mt-36 rounded-card bg-surface p-6 shadow-soft lg:scroll-mt-32"
            >
              <h2 className="text-xl font-bold text-fg">{section}</h2>
              <p className="mt-2 text-sm text-muted">{SETTINGS_COPY[section]}</p>
              {section === 'Sécurité' && <ChangePasswordForm />}
            </article>
          ))}
        </section>
      </div>
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
