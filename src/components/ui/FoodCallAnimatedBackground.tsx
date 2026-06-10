import { Grainient } from './Grainient';

export type FoodCallAnimatedBackgroundVariant = 'hero' | 'profile';

interface FoodCallAnimatedBackgroundProps {
  variant?: FoodCallAnimatedBackgroundVariant;
}

export function FoodCallAnimatedBackground({ variant = 'hero' }: FoodCallAnimatedBackgroundProps) {
  return (
    <div
      aria-hidden="true"
      data-animation-engine="ogl-grainient"
      data-animation-intensity="reactbits-reference"
      data-grainient-colors="#EAB308,#F97316,#EF4444"
      data-grainient-grain="0"
      data-grainient-saturation="2.35"
      data-grainient-warp="2.15/3.9/73"
      data-reactbits-source="Grainient"
      data-reduced-motion-fallback="static"
      data-testid="foodcall-animated-background"
      className={`foodcall-animated-background foodcall-animated-background--${variant} pointer-events-none absolute inset-0 overflow-hidden`}
    >
      <div className="foodcall-animated-background__fallback" />
      <Grainient
        className="foodcall-animated-background__grainient"
        grainAmount={0}
        saturation={2.35}
        zoom={1}
      />
    </div>
  );
}
