import { useRef, useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { NAV_ITEMS, ROUTES, USER_MENU_ITEMS } from '@/lib';
import { useAuthStore } from '@/stores/auth-store';
import { authService } from '@/services';

function getUserLabel(user: ReturnType<typeof useAuthStore.getState>['user']) {
  const displayName = user?.displayName?.trim();
  if (displayName) return displayName;

  const email = user?.email?.trim();
  if (email) return email.split('@')[0] || email;

  return 'Compte';
}

function getUserInitial(label: string) {
  return label.trim().charAt(0).toUpperCase() || 'C';
}

export function TopBar() {
  const user = useAuthStore((state) => state.user);
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const userLabel = getUserLabel(user);
  const userInitial = getUserInitial(userLabel);

  async function handleLogout() {
    setIsLoggingOut(true);
    try {
      await authService.logout();
      navigate(ROUTES.login);
    } finally {
      setIsLoggingOut(false);
      if (detailsRef.current) detailsRef.current.open = false;
    }
  }

  return (
    <header className="sticky top-3 z-30 mx-auto max-w-7xl px-4">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-full border border-border/80 bg-surface/85 px-5 py-3 shadow-soft backdrop-blur">
        <Link to={ROUTES.discover} className="flex items-center gap-2 font-bold">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary text-white">FC</span>
          <span>
            Food<span className="text-primary">Call</span>
          </span>
        </Link>

        <nav aria-label="Navigation principale" className="flex flex-wrap gap-2">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `rounded-full px-4 py-2 text-sm font-semibold transition-colors transition-transform duration-150 ease-out active:scale-[0.97] ${isActive ? 'bg-primary text-white' : 'text-muted hover:bg-soft'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notifications"
            className="relative grid h-10 w-10 place-items-center rounded-full bg-soft text-primary transition-transform duration-150 ease-out active:scale-[0.97]"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-danger" />
          </button>

          <details ref={detailsRef} className="relative">
            <summary className="flex cursor-pointer list-none items-center gap-2 rounded-full bg-surface-warm py-1 pl-1 pr-3 transition-transform duration-150 ease-out active:scale-[0.97]">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-bold text-white">
                {userInitial}
              </span>
              <span className="text-sm font-bold">{userLabel}</span>
            </summary>
            <div className="absolute right-0 mt-2 w-48 rounded-card border border-border bg-surface p-2 shadow-card">
              {USER_MENU_ITEMS.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (detailsRef.current) detailsRef.current.open = false;
                  }}
                  className="block rounded-full px-4 py-3 text-sm font-semibold text-muted transition-colors transition-transform duration-150 ease-out hover:bg-soft active:scale-[0.97]"
                >
                  {item.label}
                </Link>
              ))}
              <button
                onClick={handleLogout}
                disabled={isLoggingOut}
                aria-disabled={isLoggingOut}
                className="block w-full rounded-full px-4 py-3 text-left text-sm font-semibold text-danger transition-colors transition-transform duration-150 ease-out hover:bg-soft active:scale-[0.97] disabled:opacity-60"
              >
                {isLoggingOut ? 'Déconnexion…' : 'Se déconnecter'}
              </button>
            </div>
          </details>
        </div>
      </div>
    </header>
  );
}
