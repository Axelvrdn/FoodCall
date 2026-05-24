export interface TagProps { children: string; tone?: 'primary' | 'success' | 'neutral' | 'danger'; }
const tones = { primary: 'bg-primary/10 text-primary', success: 'bg-success/10 text-success', neutral: 'bg-soft text-muted', danger: 'bg-danger/10 text-danger' };
export function Tag({ children, tone = 'primary' }: TagProps) { return <span className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${tones[tone]}`}>{children}</span>; }
