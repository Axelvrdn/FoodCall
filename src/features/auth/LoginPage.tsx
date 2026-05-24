import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts';
import { ROUTES } from '@/lib';
import { authService } from '@/services';
import { useAuthStore } from '@/stores/auth-store';
import type { NormalizedApiError } from '@/services/api-client';

export function LoginPage() {
  const navigate = useNavigate();
  const setTokens = useAuthStore((state) => state.setTokens);
  const setUser = useAuthStore((state) => state.setUser);
  const [error, setError] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsPending(true);
    const data = new FormData(event.currentTarget);
    try {
      const response = await authService.login({
        email: String(data.get('email')),
        password: String(data.get('password')),
      });
      setTokens(response.accessToken, response.refreshToken);
      const userResponse = await authService.me();
      setUser(userResponse);
      navigate(ROUTES.discover);
    } catch (err) {
      const normalized = err as NormalizedApiError;
      if (normalized?.status === 401) {
        setError('Connexion impossible avec ces identifiants.');
      } else if (normalized?.status === 429) {
        setError('Trop de requêtes. Réessaie plus tard.');
      } else {
        setError('Connexion impossible avec ces identifiants.');
      }
    } finally {
      setIsPending(false);
    }
  }

  return (
    <AuthLayout>
      <h1 className="text-2xl font-bold text-fg">Connexion</h1>
      <form onSubmit={onSubmit} className="mt-6 grid gap-5">
        <div className="grid gap-2">
          <label htmlFor="login-email" className="text-sm font-semibold text-fg">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor="login-password" className="text-sm font-semibold text-fg">
            Mot de passe
          </label>
          <input
            id="login-password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
            className="rounded-2xl border border-border bg-surface-warm px-4 py-3 text-fg placeholder:text-muted transition-colors duration-150 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={isPending}
          aria-disabled={isPending}
          className="rounded-full bg-primary px-5 py-3 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>
      <div className="mt-5 flex justify-between text-sm text-muted">
        <Link to={ROUTES.register}>Créer un compte</Link>
        <Link to={ROUTES.forgotPassword}>Mot de passe oublié</Link>
      </div>
    </AuthLayout>
  );
}