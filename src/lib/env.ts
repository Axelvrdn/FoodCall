export const env = {
  apiUrl: import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api',
  mswEnabled: import.meta.env.VITE_MSW_ENABLED !== 'false' && import.meta.env.DEV,
};
