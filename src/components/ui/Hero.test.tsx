import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Hero } from './Hero';

describe('Hero', () => {
  it('renders the reusable FoodCall animated background behind hero content', () => {
    render(
      <Hero
        title="Découvre le bon resto, au bon moment"
        subtitle="Recherche autour de toi, compare les options, puis lance un vote de groupe."
        actions={<a href="/groupes">Voir les groupes</a>}
      />,
    );

    const hero = screen.getByRole('region', { name: 'Découvre le bon resto, au bon moment' });
    const background = within(hero).getByTestId('foodcall-animated-background');

    expect(background).toHaveAttribute('aria-hidden', 'true');
    expect(background).toHaveClass('foodcall-animated-background');
    expect(background).toHaveClass('foodcall-animated-background--hero');
    expect(background).toHaveAttribute('data-reactbits-source', 'Grainient');
    expect(background).toHaveAttribute('data-animation-engine', 'ogl-grainient');
    expect(background).toHaveAttribute('data-reduced-motion-fallback', 'static');
    expect(background).toHaveAttribute('data-animation-intensity', 'reactbits-reference');
    expect(background).toHaveAttribute('data-grainient-colors', '#EAB308,#F97316,#EF4444');
    expect(background).toHaveAttribute('data-grainient-grain', '0');
    expect(background).toHaveAttribute('data-grainient-saturation', '2.35');
    expect(background).toHaveAttribute('data-grainient-warp', '2.15/3.9/73');
    expect(screen.getByRole('heading', { name: 'Découvre le bon resto, au bon moment' })).toBeInTheDocument();
    expect(screen.getByText('Recherche autour de toi, compare les options, puis lance un vote de groupe.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Voir les groupes' })).toBeInTheDocument();
  });
});
