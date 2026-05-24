import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users-service';
import { useAuthStore } from '@/stores/auth-store';
import { authQueryKeys } from './auth-queries';

export function AuthBootstrapProvider({ children }: { children: React.ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const setUser = useAuthStore((s) => s.setUser);

  const needsBootstrap = !!accessToken && !user;

  const query = useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: () => usersService.me(),
    enabled: needsBootstrap,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  useEffect(() => {
    if (needsBootstrap && query.isSuccess && query.data) {
      setUser(query.data);
    }
  }, [needsBootstrap, query.isSuccess, query.data, setUser]);

  useEffect(() => {
    if (needsBootstrap && query.isError) {
      logout();
    }
  }, [needsBootstrap, query.isError, logout]);

  if (needsBootstrap && query.isPending) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted">Chargement de la session…</p>
      </div>
    );
  }

  return <>{children}</>;
}