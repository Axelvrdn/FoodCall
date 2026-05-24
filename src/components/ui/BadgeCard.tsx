export interface BadgeCardProps { icon: string; title: string; subtitle: string; }
export function BadgeCard({ icon, title, subtitle }: BadgeCardProps) { return <article className="rounded-card bg-surface p-5 shadow-soft"><p className="font-mono text-3xl">{icon}</p><h3 className="mt-3 font-bold">{title}</h3><p className="text-sm text-muted">{subtitle}</p></article>; }
