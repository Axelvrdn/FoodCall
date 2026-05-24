import { useState } from 'react';
import type { RecommendationItem } from '@/types/api';
import { ExplanationBreakdown } from './ExplanationBreakdown';

interface RecommendationsListProps {
  recommendations: RecommendationItem[];
  status: 'pending' | 'error' | 'success';
  error?: { message?: string } | null;
  meta: { nextCursor: string | null };
  onLoadMore?: () => void;
  onRefresh?: () => void;
  isAdvisory?: boolean;
  emptyReason?: string;
}

function ScoreBadge({ score }: { score: number }) {
  const pct = (score * 100).toFixed(0);
  return (
    <div className="flex items-center gap-1 shrink-0">
      <span className="text-lg font-bold text-primary">{pct}</span>
      <span className="text-xs text-muted">/100</span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  return (
    <div className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-white">
      {rank}
    </div>
  );
}

function RecommendationCard({ recommendation }: { recommendation: RecommendationItem }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="grid gap-3 rounded-card bg-surface p-4 shadow-soft">
      <div className="flex items-start gap-3">
        <RankBadge rank={recommendation.rank} />
        <div className="min-w-0 flex-1 grid gap-1">
          <p className="font-semibold text-fg truncate">{recommendation.restaurant.name}</p>
          <p className="text-xs text-muted truncate">{recommendation.restaurant.address}</p>
          {recommendation.explanation.summary && (
            <p className="text-xs text-muted leading-relaxed line-clamp-2">
              {recommendation.explanation.summary}
            </p>
          )}
        </div>
        <ScoreBadge score={recommendation.score} />
      </div>

      <button
        type="button"
        className="flex items-center gap-1 text-xs font-semibold text-primary transition-transform duration-150 ease-out active:scale-[0.97] self-start"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Masquer les details' : 'Voir les details'}
        <span className={expanded ? 'rotate-180' : ''} aria-hidden="true">
          &#9660;
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border pt-3">
          <ExplanationBreakdown explanation={recommendation.explanation} />
        </div>
      )}
    </div>
  );
}

export function RecommendationsList({
  recommendations,
  status,
  error,
  meta,
  onLoadMore,
  onRefresh,
  isAdvisory = true,
  emptyReason,
}: RecommendationsListProps) {
  if (status === 'pending') {
    return (
      <div className="grid gap-4">
        <div className="rounded-card bg-surface p-8 shadow-soft text-center">
          <p role="status" className="text-sm text-muted">
            Chargement des recommandations...
          </p>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="grid gap-4">
        <div role="alert" className="rounded bg-danger/10 p-4 text-sm text-danger">
          Impossible de charger les recommandations.
          {error?.message && <span> {error.message}</span>}
        </div>
        {onRefresh && (
          <button
            type="button"
            className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-start"
            onClick={onRefresh}
          >
            Reessayer
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {isAdvisory && (
        <div className="rounded bg-soft/50 border border-border p-4">
          <p className="text-xs text-muted leading-relaxed">
            Ces recommandations sont des suggestions basees sur la distance, le budget, la qualite et l'historique de votre groupe. Vous decidez quel restaurant choisir.
          </p>
        </div>
      )}

      {recommendations.length === 0 ? (
        <div className="rounded-card bg-surface p-6 shadow-soft text-center">
          <p className="text-sm text-muted">
            {emptyReason ?? 'Aucune recommandation disponible.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recommendations.map((rec) => (
            <RecommendationCard key={rec.restaurantId} recommendation={rec} />
          ))}
        </div>
      )}

      {meta.nextCursor && onLoadMore && (
        <button
          type="button"
          className="rounded-radius bg-surface border border-border px-4 py-2 text-sm font-semibold text-fg transition-transform duration-150 ease-out active:scale-[0.97] self-center"
          onClick={onLoadMore}
        >
          Charger plus
        </button>
      )}
    </div>
  );
}
