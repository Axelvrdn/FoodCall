import '@testing-library/jest-dom/vitest';
import { resetMockState } from '@/mocks/handlers';
import { server } from '@/mocks/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetMockState();
  server.resetHandlers();
});
afterAll(() => server.close());
