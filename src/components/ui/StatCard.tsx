export interface StatCardProps { value: string | number; label: string; }
export function StatCard({ value, label }: StatCardProps) { return <article className="rounded-card bg-surface p-5 shadow-soft"><p className="font-mono text-3xl font-bold text-primary">{value}</p><p className="mt-1 text-sm font-semibold text-muted">{label}</p></article>; }
