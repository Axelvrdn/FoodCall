import type { PropsWithChildren } from 'react';
import { TopBar } from './TopBar';

export function AppLayout({ children }: PropsWithChildren) { return <div className="min-h-[100dvh] bg-bg pb-12"><TopBar /><main className="mx-auto mt-6 max-w-7xl px-4">{children}</main></div>; }
