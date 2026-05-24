import type { User } from './api';

export type RoutePath = '/' | '/connexion' | '/inscription' | '/mot-de-passe-oublie' | '/onboarding' | '/decouvrir' | '/groupes' | `/groupes/${string}` | '/avis' | '/mes-calls' | '/profil' | '/parametres';
export interface RouteParams { group?: { id: string } }
export interface NavItem { label: string; path: RoutePath; }
export interface UserMenuItem { label: string; path: RoutePath; }
export type AsyncState<T> = { status: 'idle' | 'loading' | 'success' | 'error'; data: T | null; error: string | null };
export interface PaginatedState<T> { items: T[]; nextCursor: string | null; isLoadingMore: boolean; }
export interface LoginFormValues { email: string; password: string; }
export interface RegisterFormValues { email: string; password: string; displayName: string; }
export interface ChangePasswordFormValues { currentPassword: string; newPassword: string; }
export interface AuthState { user: User | null; accessToken: string | null; refreshToken: string | null; isAuthenticated: boolean; }
export interface UIState { sidebarOpen: boolean; activeTab: string; selectedGroupId: string | null; }
