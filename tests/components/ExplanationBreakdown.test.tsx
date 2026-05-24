import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExplanationBreakdown } from '@/components/ExplanationBreakdown';
import type { RecommendationExplanationComponent } from '@/types/api';

const sampleComponents: RecommendationExplanationComponent[] = [
  { key: 'restaurantScore', score: 90, weight: 0.5, contribution: 0.45, reason: '5.0 average rating from 2 reviews' },
  { key: 'distance', score: 80, weight: 0.3, contribution: 0.24, reason: '1.8 km from group start point' },
  { key: 'budget', score: 70, weight: 0.15, contribution: 0.105, reason: '38 euros exceeds 20 budget' },
  { key: 'history', score: 60, weight: 0.05, contribution: 0.03, reason: 'Previously selected and highly rated' },
];

const sampleExplanation = {
  summary: 'Top-rated nearby restaurant with excellent reviews.',
  components: sampleComponents,
};

describe('ExplanationBreakdown', () => {
  it('renders summary text', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText(sampleExplanation.summary)).toBeInTheDocument();
  });

  it('renders all four component labels', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('Qualite du restaurant')).toBeInTheDocument();
    expect(screen.getByText('Distance')).toBeInTheDocument();
    expect(screen.getByText('Budget')).toBeInTheDocument();
    expect(screen.getByText('Votre historique')).toBeInTheDocument();
  });

  it('displays component scores as X/100', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('90/100')).toBeInTheDocument();
    expect(screen.getByText('80/100')).toBeInTheDocument();
  });

  it('displays weights as percentages', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('Poids : 50%')).toBeInTheDocument();
    expect(screen.getByText('Poids : 30%')).toBeInTheDocument();
    expect(screen.getByText('Poids : 15%')).toBeInTheDocument();
    expect(screen.getByText('Poids : 5%')).toBeInTheDocument();
  });

  it('displays contribution points', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('45.0 points')).toBeInTheDocument();
    expect(screen.getByText('24.0 points')).toBeInTheDocument();
  });

  it('displays reason text for each component', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('5.0 average rating from 2 reviews')).toBeInTheDocument();
    expect(screen.getByText('1.8 km from group start point')).toBeInTheDocument();
  });

  it('displays total score', () => {
    render(<ExplanationBreakdown explanation={sampleExplanation} />);
    expect(screen.getByText('Score total')).toBeInTheDocument();
    expect(screen.getByText('82.5 / 100')).toBeInTheDocument();
  });

  it('shows fallback when components array is empty', () => {
    render(<ExplanationBreakdown explanation={{ summary: 'No details', components: [] }} />);
    expect(screen.getByText('Aucun detail de score disponible.')).toBeInTheDocument();
  });
});
