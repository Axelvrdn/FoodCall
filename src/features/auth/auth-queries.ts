import { useQuery } from '@tanstack/react-query';
import { usersService } from '@/services/users-service';
import { useAuthStore } from '@/stores/auth-store';

export const authQueryKeys = {
  currentUser: ['auth', 'current-user'] as const,
};

export function useCurrentUserQuery() {
  const accessToken = useAuthStore((s) => s.accessToken);

  return useQuery({
    queryKey: authQueryKeys.currentUser,
    queryFn: () => usersService.me(),
    enabled: !!accessToken,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
}