export interface MapPlaceholderProps {
  title?: string;
  label?: string;
  detail?: string;
}

export function MapPlaceholder({
  title = 'Carte en préparation',
  label = 'La carte interactive arrive plus tard. Les résultats ci-dessous viennent déjà de l’API restaurants.',
  detail,
}: MapPlaceholderProps) {
  return (
    <div className="grid min-h-72 place-items-center rounded-card border border-dashed border-primary/40 bg-surface-warm p-8 text-center text-muted">
      <div className="max-w-md">
        <p className="font-display text-3xl text-primary">{title}</p>
        <p className="mt-2 text-sm leading-relaxed">{label}</p>
        {detail && <p className="mt-3 text-xs font-semibold uppercase tracking-[0.18em] text-primary">{detail}</p>}
      </div>
    </div>
  );
}
