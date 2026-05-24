import type { GroupRole } from '@/types/api';
import {
  useGroupsQuery,
  useGroupQuery,
  useGroupMembersQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useCreateInviteMutation,
  useJoinGroupMutation,
} from '@/features/server-state';

export {
  useGroupsQuery,
  useGroupQuery,
  useGroupMembersQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useCreateInviteMutation,
  useJoinGroupMutation,
};

export function canManageGroup(role: GroupRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canCreateInvite(role: GroupRole): boolean {
  return role === 'owner' || role === 'admin';
}

export function canDeleteGroup(role: GroupRole): boolean {
  return role === 'owner';
}