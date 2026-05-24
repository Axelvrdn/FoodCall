export interface ReviewCardProps { restaurant: string; rating: number; text: string; }
export function ReviewCard({ restaurant, rating, text }: ReviewCardProps) { return <article className="rounded-card bg-surface p-5 shadow-soft"><p className="font-mono text-primary">{rating}/5</p><h3 className="mt-2 text-lg font-bold">{restaurant}</h3><p className="mt-2 text-muted">{text}</p></article>; }
