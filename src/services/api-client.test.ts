import { beforeEach, describe, expect, it, vi } from 'vitest';
import { normalizeApiError } from './api-client';
import { useAuthStore } from '@/stores/auth-store';
import { queryClient } from '@/app/query-client';
import type { AxiosError } from 'axios';

vi.mock('@/app/query-client', () => ({
  queryClient: { clear: vi.fn() },
}));

describe('api client helpers', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('normalizes documented API status codes to French messages', () => {
    const error = { response: { status: 404 } } as AxiosError;
    expect(normalizeApiError(error).message).toBe('Ressource introuvable.');
  });

  it('uses server message when available', () => {
    const error = { response: { status: 400, data: { message: 'Email requis.', error: 'VALIDATION_ERROR' } } } as AxiosError;
    const normalized = normalizeApiError(error);
    expect(normalized.message).toBe('Email requis.');
    expect(normalized.code).toBe('VALIDATION_ERROR');
  });

  it('joins server validation message arrays into a readable message', () => {
    const error = { response: { status: 400, data: { message: ['Email requis.', 'Mot de passe trop court.'], error: 'VALIDATION_ERROR' } } } as AxiosError;
    expect(normalizeApiError(error).message).toBe('Email requis., Mot de passe trop court.');
  });

  it('falls back when server validation message array is empty', () => {
    const error = { response: { status: 400, data: { message: [], error: 'VALIDATION_ERROR' } } } as AxiosError;
    expect(normalizeApiError(error).message).toBe('Requête invalide.');
  });

  it('falls back to status code string when no server error field', () => {
    const error = { response: { status: 500, data: {} } } as AxiosError;
    expect(normalizeApiError(error).code).toBe('500');
  });

  it('defaults to 500 for network errors without response', () => {
    const error = new Error('Network Error') as AxiosError;
    expect(normalizeApiError(error).status).toBe(500);
  });
});

describe('auth store token lifecycle', () => {
  afterEach(() => {
    useAuthStore.getState().logout();
  });

  it('setTokens persists tokens in store and marks authenticated', () => {
    useAuthStore.getState().setTokens('test-access', 'test-refresh');
    expect(useAuthStore.getState().accessToken).toBe('test-access');
    expect(useAuthStore.getState().refreshToken).toBe('test-refresh');
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('logout clears user, tokens, and isAuthenticated', () => {
    useAuthStore.getState().setTokens('a', 'r');
    useAuthStore.getState().setUser({ id: '1', email: 'x@x.com', displayName: 'X', avatarUrl: null, reputationScore: 0, createdAt: '', updatedAt: '' });
    useAuthStore.getState().logout();
    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().refreshToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('clearTokens removes tokens but preserves user', () => {
    useAuthStore.getState().setTokens('a', 'r');
    useAuthStore.getState().setUser({ id: '1', email: 'x@x.com', displayName: 'X', avatarUrl: null, reputationScore: 0, createdAt: '', updatedAt: '' });
    useAuthStore.getState().clearTokens();
    expect(useAuthStore.getState().user).not.toBeNull();
    expect(useAuthStore.getState().accessToken).toBeNull();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});

describe('queryClient export', () => {
  it('queryClient is importable and has clear method', () => {
    expect(queryClient).toBeDefined();
    expect(typeof queryClient.clear).toBe('function');
  });
});
