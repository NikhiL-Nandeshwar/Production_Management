import { getList } from './resources';
import { mutation, request } from './client';
import { ApiError } from './errors';
import type { User } from '@/types/api';
import type { UsersCreateRequest, UsersUpdateRequest } from '@/types/requests';

function decodeUser(value: unknown): User {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The user response returned an unsupported format.');
  const user = value as User;
  if (
    !Number.isInteger(user.id) ||
    !Number.isInteger(user.roleId) ||
    typeof user.username !== 'string' ||
    typeof user.email !== 'string' ||
    typeof user.displayName !== 'string' ||
    typeof user.isActive !== 'boolean'
  )
    throw new ApiError('The user response is missing required fields.');
  return user;
}

export async function getUsers(companyId: number): Promise<User[]> {
  const result = await getList('users', '/Users/GetAll', { companyId });
  return result.rows.map(decodeUser);
}

export const getUserById = (id: number, companyId: number) =>
  request<unknown>('GET', `/Users/${id}/GetById`, undefined, { companyId }).then(
    decodeUser,
  );

export const createUser = (companyId: number, payload: UsersCreateRequest) =>
  mutation('POST', '/Users/Create', payload, { companyId });

export const updateUser = (companyId: number, payload: UsersUpdateRequest) =>
  mutation('PUT', '/Users/Update', payload, { companyId });

export const toggleUserActive = (id: number, companyId: number) =>
  mutation('PATCH', `/Users/${id}/toggle-active`, undefined, { companyId });
