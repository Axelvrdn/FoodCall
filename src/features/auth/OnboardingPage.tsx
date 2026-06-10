import { Link } from 'react-router-dom';
import { Hero, Pill } from '@/components/ui';
import { ROUTES } from '@/lib';

export function OnboardingPage() {
  return (
    <div className="grid gap-6">
      <Hero
        title="Prépare ton premier FoodCall"
        subtitle="Shell d’onboarding sans endpoint dédié: l’onboarding reste léger tant que l’API ne persiste pas encore les préférences. Tu peux continuer maintenant et revenir compléter ton profil plus tard."
      />

      <section className="grid gap-6 rounded-card bg-surface p-6 shadow-soft lg:grid-cols-[1fr_auto] lg:items-start">
        <div className="grid gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Onboarding non bloquant</p>
            <h2 className="mt-2 text-2xl font-bold text-fg">Étapes prévues</h2>
            <p className="mt-2 max-w-[65ch] text-sm text-muted">
              Tu pourras compléter ces préférences plus tard: ville de départ, envies alimentaires, budget et création ou rejoindre un groupe.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Pill label="Ville" active />
            <Pill label="Préférences alimentaires" />
            <Pill label="Créer ou rejoindre un groupe" />
          </div>
        </div>

        <div className="flex flex-wrap gap-3 lg:justify-end">
          <Link
            to={ROUTES.discover}
            className="rounded-full bg-primary px-5 py-3 text-sm font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Continuer vers Découvrir
          </Link>
          <Link
            to={ROUTES.groups}
            className="rounded-full border border-border bg-surface px-5 py-3 text-sm font-bold text-fg transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            Rejoindre mes groupes
          </Link>
        </div>
      </section>
    </div>
  );
}
