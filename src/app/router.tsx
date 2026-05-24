import { Navigate, Outlet, createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layouts';
import { CallsPage } from '@/features/calls/CallsPage';
import { DiscoverPage } from '@/features/discover/DiscoverPage';
import { RestaurantDetailPage } from '@/features/discover/RestaurantDetailPage';
import { ForgotPasswordPage } from '@/features/auth/ForgotPasswordPage';
import { GroupDetailPage } from '@/features/groups/GroupDetailPage';
import { GroupsPage } from '@/features/groups/GroupsPage';
import { SessionsPage } from '@/features/sessions/SessionsPage';
import { SessionDetailPage } from '@/features/sessions/SessionDetailPage';
import { CandidatesPage } from '@/features/sessions/CandidatesPage';
import { SessionRecommendationsPage } from '@/features/sessions/SessionRecommendations';
import { GroupRecommendationsPage } from '@/features/groups/GroupRecommendations';
import { LoginPage } from '@/features/auth/LoginPage';
import { NotFoundPage } from '@/features/not-found/NotFoundPage';
import { OnboardingPage } from '@/features/auth/OnboardingPage';
import { ProfilePage } from '@/features/profile/ProfilePage';
import { RegisterPage } from '@/features/auth/RegisterPage';
import { ReviewsPage } from '@/features/reviews/ReviewsPage';
import { ROUTES } from '@/lib';
import { SettingsPage } from '@/features/settings/SettingsPage';
import { useAuthStore } from '@/stores/auth-store';

/* eslint-disable react-refresh/only-export-components */

export function AuthenticatedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (accessToken && !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Chargement de la session…</p>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to={ROUTES.login} replace />;
}

export function UnauthenticatedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);

  if (accessToken && !user) {
    return null;
  }

  return isAuthenticated ? <Navigate to={ROUTES.discover} replace /> : <Outlet />;
}

function AppShell() { return <AppLayout><Outlet /></AppLayout>; }

export const router = createBrowserRouter([
  { path: '/', element: <Navigate to={ROUTES.discover} replace /> },
  { element: <UnauthenticatedRoute />, children: [
    { path: ROUTES.login, element: <LoginPage /> },
    { path: ROUTES.register, element: <RegisterPage /> },
    { path: ROUTES.forgotPassword, element: <ForgotPasswordPage /> },
  ] },
  { element: <AuthenticatedRoute />, children: [{ element: <AppShell />, children: [
    { path: ROUTES.onboarding, element: <OnboardingPage /> },
    { path: ROUTES.discover, element: <DiscoverPage /> },
    { path: `${ROUTES.restaurantDetail}`, element: <RestaurantDetailPage /> },
    { path: ROUTES.groups, element: <GroupsPage /> },
    { path: `${ROUTES.groups}/:groupId/recommendations`, element: <GroupRecommendationsPage /> },
    { path: `${ROUTES.groups}/:id`, element: <GroupDetailPage /> },
    { path: `${ROUTES.groups}/:groupId/sessions`, element: <SessionsPage /> },
    { path: '/sessions/:id', element: <SessionDetailPage /> },
    { path: '/sessions/:id/recommendations', element: <SessionRecommendationsPage /> },
    { path: '/sessions/:id/candidates', element: <CandidatesPage /> },
    { path: ROUTES.reviews, element: <ReviewsPage /> },
    { path: ROUTES.calls, element: <CallsPage /> },
    { path: ROUTES.profile, element: <ProfilePage /> },
    { path: ROUTES.settings, element: <SettingsPage /> },
  ] }] },
  { path: '*', element: <NotFoundPage /> },
]);