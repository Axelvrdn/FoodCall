import { Link } from 'react-router-dom';
import { AuthLayout } from '@/components/layouts';
import { ROUTES } from '@/lib';

export function ForgotPasswordPage() { return <AuthLayout><h1 className="text-2xl font-bold">Mot de passe oublié</h1><p className="mt-4 text-muted">L’API P1 ne fournit pas encore d’endpoint de réinitialisation. Pour le MVP, contacte le support FoodCall pour sécuriser la récupération du compte.</p><Link className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 font-bold text-white transition-transform duration-150 ease-out active:scale-[0.97]" to={ROUTES.login}>Retour à la connexion</Link></AuthLayout>; }
