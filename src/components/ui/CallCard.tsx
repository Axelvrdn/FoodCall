import type { FoodCall } from '@/types/api';
import { Tag } from './Tag';
export interface CallCardProps { call: FoodCall; }
export function CallCard({ call }: CallCardProps) { return <article className="rounded-card bg-surface p-5 shadow-soft"><Tag tone="success">Call actif</Tag><h3 className="mt-3 text-xl font-bold">{call.restaurant?.name ?? 'Restaurant'}</h3><p className="mt-2 text-muted">{call.pitch}</p><p className="mt-4 text-sm font-semibold text-primary">{call.group?.name ?? 'Groupe'}</p></article>; }
