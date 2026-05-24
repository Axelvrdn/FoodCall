import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthBootstrapProvider } from '@/features/auth/AuthBootstrapProvider';
import { queryClient } from './query-client';
import { router } from './router';

/* eslint-disable react-refresh/only-export-components */
export { queryClient } from './query-client';

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthBootstrapProvider>
        <RouterProvider router={router} />
      </AuthBootstrapProvider>
    </QueryClientProvider>
  );
}