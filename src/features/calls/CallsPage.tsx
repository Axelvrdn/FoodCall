import { BadgeCard, Hero, ScoreRing } from '@/components/ui';

export function CallsPage() {
  return (
    <div className="grid gap-6">
      <Hero
        title="Mes calls"
        subtitle="Tes recommandations et ton score de réputation."
      />
      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.7fr]">
        <main className="grid gap-4">
          <p className="text-sm text-muted">
            Les calls utilisateur seront disponibles lorsque le backend fournira un endpoint de liste par utilisateur.
          </p>
        </main>
        <aside className="grid gap-4 rounded-card bg-surface p-5 shadow-soft">
          <ScoreRing value={84} label="Score de calls" />
          <BadgeCard
            icon="FC"
            title="Call fiable"
            subtitle="Badge visuel sans API de gamification."
          />
        </aside>
      </section>
    </div>
  );
}