export interface ProgressBarProps { value: number; label?: string; }
export function ProgressBar({ value, label }: ProgressBarProps) { const safeValue = Math.min(100, Math.max(0, value)); return <div aria-label={label} className="h-3 overflow-hidden rounded-full bg-soft"><div className="h-full rounded-full bg-primary-gradient" style={{ width: `${safeValue}%` }} /></div>; }
