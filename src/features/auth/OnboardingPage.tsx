import { Hero, Pill } from '@/components/ui';

export function OnboardingPage() { return <div className="grid gap-6"><Hero title="Prépare ton premier FoodCall" subtitle="Shell d’onboarding sans endpoint dédié: préférences et groupes seront branchés quand l’API l’exposera." /><section className="rounded-card bg-surface p-6 shadow-soft"><h2 className="text-2xl font-bold">Étapes prévues</h2><div className="mt-4 flex flex-wrap gap-3"><Pill label="Ville" active /><Pill label="Préférences alimentaires" /><Pill label="Créer ou rejoindre un groupe" /></div></section></div>; }
