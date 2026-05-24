import { create } from 'zustand';
import type { User } from '@/types/api';

const ACCESS_KEY = 'foodcall.accessToken';
const REFRESH_KEY = 'foodcall.refreshToken';

interface AuthStoreState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User | null) => void;
  clearTokens: () => void;
  logout: () => void;
}

function storage(): Storage | null {
  return typeof window !== 'undefined' && typeof window.localStorage?.getItem === 'function'
    ? window.localStorage
    : null;
}

function readStored(key: string): string | null {
  return storage()?.getItem(key) ?? null;
}

function removeStored(key: string): void {
  storage()?.removeItem(key);
}

function writeStored(key: string, value: string): void {
  storage()?.setItem(key, value);
}

export const useAuthStore = create<AuthStoreState>((set) => ({
  user: null,
  accessToken: readStored(ACCESS_KEY),
  refreshToken: readStored(REFRESH_KEY),
  isAuthenticated: Boolean(readStored(ACCESS_KEY)),
  setTokens: (accessToken, refreshToken) => {
    writeStored(ACCESS_KEY, accessToken);
    writeStored(REFRESH_KEY, refreshToken);
    set({ accessToken, refreshToken, isAuthenticated: true });
  },
  setUser: (user) => set({ user }),
  clearTokens: () => {
    removeStored(ACCESS_KEY);
    removeStored(REFRESH_KEY);
    set({ accessToken: null, refreshToken: null, isAuthenticated: false });
  },
  logout: () => {
    removeStored(ACCESS_KEY);
    removeStored(REFRESH_KEY);
    set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
  },
}));