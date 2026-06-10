import { useId } from 'react';
import { FoodCallAnimatedBackground } from './FoodCallAnimatedBackground';

export interface HeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}

export function Hero({ eyebrow, title, subtitle, actions }: HeroProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      role="region"
      className="relative isolate overflow-hidden rounded-card bg-primary-gradient p-8 text-white shadow-card md:p-12"
    >
      <FoodCallAnimatedBackground />
      <div className="relative max-w-3xl">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-white/80">{eyebrow ?? 'FoodCall'}</p>
        <h1 id={titleId} className="mt-3 font-display text-5xl leading-tight md:text-6xl">{title}</h1>
        {subtitle ? <p className="mt-4 max-w-2xl text-lg text-white/90">{subtitle}</p> : null}
        {actions ? <div className="mt-6 flex flex-wrap gap-3">{actions}</div> : null}
      </div>
    </section>
  );
}
