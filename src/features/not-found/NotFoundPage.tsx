import { Link } from 'react-router-dom';
import { ROUTES } from '@/lib';

export function NotFoundPage() { return <main className="grid min-h-screen place-items-center bg-bg p-6 text-center"><div className="rounded-card bg-surface p-8 shadow-card"><h1 className="font-display text-5xl text-primary">404</h1><p className="mt-3 text-muted">Cette page FoodCall n’existe pas.</p><Link className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-white" to={ROUTES.discover}>Retour à Découvrir</Link></div></main>; }
