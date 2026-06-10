import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts';
import { ROUTES, validatePassword } from '@/lib';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/auth-store';
import type { NormalizedApiError } from '@/services/api-client';

export function RegisterPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const logout = useAuthStore((state) => state.logout);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFieldErrors([]);
    setFormError(null);

    const data = new FormData(event.currentTarget);
    const password = String(data.get('password'));

    const result = validatePassword(password);
    if (!result.valid) {
      setFieldErrors(result.errors);
      return;
    }

    setIsPending(true);
    try {
      const response = await authService.register({
        email: String(data.get('email')),
        displayName: String(data.get('displayName')),
        password,
      });
      setTokens(response.accessToken, response.refreshToken);
      let userResponse;
      try {
        userResponse = await authService.me();
      } catch (err) {
        logout();
        throw err;
      }
      setUser(userResponse);
      navigate(ROUTES.onboarding);
    } catch (err) {
      const normalized = err as NormalizedApiError;
      if (normalized?.status === 409) {
        setFormError('Un compte avec cet email existe déjà.');
      } else {
        setFormError('Erreur lors de l’inscription. Réessaie plus tard.');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-fg">Inscription</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="register-displayName" className="text-sm font-semibold text-fg">
            Nom affiché
          </label>
          <input
            id="register-displayName"
            name="displayName"
            required
            autoComplete="name"
            className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="register-email" className="text-sm font-semibold text-fg">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="register-password" className="text-sm font-semibold text-fg">
            Mot de passe
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            required
            autoComplete="new-password"
            className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          {fieldErrors.length > 0 && (
            <p role="alert" className="text-sm text-danger">
              Mot de passe : {fieldErrors.join(', ')}
            </p>
          )}
        </div>
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
          {isPending ? 'Création…' : 'Créer mon compte'}
        </button>
      </form>
      <Link
        className="mt-5 block text-sm text-muted"
        to={ROUTES.login}
      >
        J’ai déjà un compte
      </Link>
    </AuthLayout>
  );
}
