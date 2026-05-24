import { API_ROUTES } from '@/lib';
import { apiClient } from './api-client';
import type { AvatarUploadRequest, User, UserUpdateRequest } from '@/types/api';

export const usersService = {
  me: () => apiClient.get<User>(API_ROUTES.me).then((r) => r.data),
  updateMe: (payload: UserUpdateRequest) => apiClient.patch<User>(API_ROUTES.me, payload).then((r) => r.data),
  uploadAvatar: (payload: AvatarUploadRequest) => apiClient.post<User>(API_ROUTES.avatar, payload).then((r) => r.data),
  deleteAvatar: () => apiClient.delete<User>(API_ROUTES.avatarDelete).then((r) => r.data),
};
