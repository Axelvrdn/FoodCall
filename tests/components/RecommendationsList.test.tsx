import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecommendationsList } from '@/components/RecommendationsList';
import { recommendationFixtures } from '@/mocks/fixtures';
import type { RecommendationItem } from '@/types/api';

describe('RecommendationsList', () => {
  const meta = { nextCursor: null };

  it('shows advisory banner by default', () => {
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
      />,
    );
    expect(screen.getByText(/Ces recommandations sont des suggestions/)).toBeInTheDocument();
  });

  it('does not show advisory banner when isAdvisory is false', () => {
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
        isAdvisory={false}
      />,
    );
    expect(screen.queryByText(/Ces recommandations sont des suggestions/)).not.toBeInTheDocument();
  });

  it('renders ranked recommendations with scores', () => {
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
      />,
    );
    expect(screen.getByText('Au Vieux Lille Gastronomique')).toBeInTheDocument();
    expect(screen.getByText('Le Petit Bistrot Lillois')).toBeInTheDocument();
    expect(screen.getByText('89')).toBeInTheDocument();
  });

  it('shows rank badges', () => {
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
      />,
    );
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('expands explanation breakdown on click', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
      />,
    );
    const detailButtons = screen.getAllByText('Voir les details');
    await user.click(detailButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Qualite du restaurant')).toBeInTheDocument();
    });
    expect(screen.getByText('Score total')).toBeInTheDocument();
  });

  it('collapses explanation on second click', async () => {
    const user = userEvent.setup();
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={meta}
      />,
    );
    const detailButtons = screen.getAllByText('Voir les details');
    await user.click(detailButtons[0]);
    await waitFor(() => {
      expect(screen.getByText('Qualite du restaurant')).toBeInTheDocument();
    });

    const collapseButton = screen.getByText('Masquer les details');
    await user.click(collapseButton);
    await waitFor(() => {
      expect(screen.queryByText('Qualite du restaurant')).not.toBeInTheDocument();
    });
  });

  it('shows Load More button when nextCursor exists', () => {
    const onLoadMore = vi.fn();
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={{ nextCursor: 'next-page' }}
        onLoadMore={onLoadMore}
      />,
    );
    expect(screen.getByText('Charger plus')).toBeInTheDocument();
  });

  it('calls onLoadMore when Load More is clicked', async () => {
    const user = userEvent.setup();
    const onLoadMore = vi.fn();
    render(
      <RecommendationsList
        recommendations={recommendationFixtures}
        status="success"
        meta={{ nextCursor: 'next-page' }}
        onLoadMore={onLoadMore}
      />,
    );
    await user.click(screen.getByText('Charger plus'));
    expect(onLoadMore).toHaveBeenCalledOnce();
  });

  it('shows empty state with custom reason when no recommendations', () => {
    render(
      <RecommendationsList
        recommendations={[]}
        status="success"
        meta={meta}
        emptyReason="Ajoutez des candidats pour obtenir des recommandations"
      />,
    );
    expect(screen.getByText('Ajoutez des candidats pour obtenir des recommandations')).toBeInTheDocument();
  });

  it('shows default empty state when no reason provided', () => {
    render(
      <RecommendationsList
        recommendations={[]}
        status="success"
        meta={meta}
      />,
    );
    expect(screen.getByText('Aucune recommandation disponible.')).toBeInTheDocument();
  });

  it('shows loading state with status role', () => {
    render(
      <RecommendationsList
        recommendations={[]}
        status="pending"
        meta={meta}
      />,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Chargement des recommandations');
  });

  it('shows error state with alert role and retry button', async () => {
    const user = userEvent.setup();
    const onRefresh = vi.fn();
    render(
      <RecommendationsList
        recommendations={[]}
        status="error"
        meta={meta}
        onRefresh={onRefresh}
      />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Reessayer')).toBeInTheDocument();
    await user.click(screen.getByText('Reessayer'));
    expect(onRefresh).toHaveBeenCalledOnce();
  });
});
