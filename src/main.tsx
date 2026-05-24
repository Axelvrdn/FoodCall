import React from 'react';
import ReactDOM from 'react-dom/client';
import '@/assets/styles/globals.css';
import { env } from '@/lib';
import { App } from './app/App';

async function enableMocks() {
  if (env.mswEnabled) {
    const { worker } = await import('@/mocks/browser');
    await worker.start({ onUnhandledRequest: 'bypass' });
  }
}

enableMocks().catch((error: unknown) => {
  console.warn('MSW disabled for this browser session.', error);
}).then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
});
