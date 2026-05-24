import type { PropsWithChildren } from 'react';

export function AuthLayout({ children }: PropsWithChildren) { return <main className="grid min-h-[100dvh] place-items-center bg-bg p-4"><section className="w-full max-w-md rounded-card bg-surface p-8 shadow-card"><div className="mb-8 text-center"><p className="font-display text-4xl text-primary">FoodCall</p><p className="mt-2 text-muted">Décider où manger, ensemble.</p></div>{children}</section></main>; }
