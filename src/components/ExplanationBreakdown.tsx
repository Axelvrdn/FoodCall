import type { RecommendationExplanationComponent } from '@/types/api';

interface ExplanationBreakdownProps {
  explanation: {
    summary: string;
    components: RecommendationExplanationComponent[];
  };
}

const COMPONENT_LABELS: Record<RecommendationExplanationComponent['key'], string> = {
  restaurantScore: 'Qualite du restaurant',
  distance: 'Distance',
  budget: 'Budget',
  history: 'Votre historique',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.max(score, 0), 100);
  return (
    <div className="h-2 w-full rounded-full bg-soft overflow-hidden" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ComponentRow({ component }: { component: RecommendationExplanationComponent }) {
  const label = COMPONENT_LABELS[component.key] ?? component.key;
  const contributionDisplay = (component.contribution * 100).toFixed(1);

  return (
    <div className="grid gap-2 rounded-card bg-surface p-4 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold text-fg">{label}</span>
        <span className="text-xs font-mono text-muted">
          {component.score.toFixed(0)}/100
        </span>
      </div>
      <ScoreBar score={component.score} />
      <div className="flex items-center justify-between gap-2 text-xs text-muted">
        <span>Poids : {(component.weight * 100).toFixed(0)}%</span>
        <span className="font-semibold text-fg">{contributionDisplay} points</span>
      </div>
      <p className="text-xs text-muted leading-relaxed">{component.reason}</p>
    </div>
  );
}

export function ExplanationBreakdown({ explanation }: ExplanationBreakdownProps) {
  const total = explanation.components
    .reduce((sum, c) => sum + c.contribution * 100, 0)
    .toFixed(1);

  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted leading-relaxed">{explanation.summary}</p>

      {explanation.components.length === 0 ? (
        <p className="text-sm text-muted">Aucun detail de score disponible.</p>
      ) : (
        <div className="grid gap-3">
          {explanation.components.map((component) => (
            <ComponentRow key={component.key} component={component} />
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <span className="text-sm font-bold text-fg">Score total</span>
        <span className="text-lg font-bold text-primary">{total} / 100</span>
      </div>
    </div>
  );
}
