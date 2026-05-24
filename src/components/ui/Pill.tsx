export interface PillProps { label: string; active?: boolean; }
export function Pill({ label, active = false }: PillProps) { return <span className={`rounded-full border px-4 py-2 text-sm font-semibold ${active ? 'border-primary bg-primary text-white' : 'border-border bg-surface text-muted'}`}>{label}</span>; }
