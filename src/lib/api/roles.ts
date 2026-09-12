import { getList } from './resources';
import { mutation, request } from './client';
import { ApiError } from './errors';
import type { Role } from '@/types/api';
import { executeAction } from './resources';
import type {
  AssignMenusRequest,
  AssignWidgetsRequest,
  RoleCreateRequest,
  RoleUpdateRequest,
} from '@/types/requests';

function decodeRole(value: unknown): Role {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The role response returned an unsupported format.');
  const role = value as Role;
  if (
    !Number.isInteger(role.id) ||
    !Number.isInteger(role.companyId) ||
    typeof role.roleName !== 'string' ||
    typeof role.description !== 'string' ||
    typeof role.isSystemRole !== 'boolean' ||
    typeof role.isActive !== 'boolean' ||
    !Number.isInteger(role.totalUsers) ||
    typeof role.createdAt !== 'string'
  )
    throw new ApiError('The role response is missing required fields.');
  return role;
}

export async function getRoles(companyId: number): Promise<Role[]> {
  const result = await getList('roles', '/Roles/GetAll', { companyId });
  return result.rows.map(decodeRole);
}

export const getRoleById = (id: number, companyId: number) =>
  request<unknown>('GET', `/Roles/${id}/GetById`, undefined, { companyId }).then(
    decodeRole,
  );

export const createRole = (companyId: number, payload: RoleCreateRequest) =>
  mutation('POST', '/Roles/Create', payload, { companyId });

export const updateRole = (companyId: number, payload: RoleUpdateRequest) =>
  mutation('PUT', '/Roles/Update', payload, { companyId });

export const toggleRoleActive = (id: number, companyId: number) =>
  mutation('PATCH', `/Roles/${id}/toggle-active`, undefined, { companyId });

export const assignMenus = (id: number, payload: AssignMenusRequest) =>
  executeAction('POST', `/Roles/${id}/AssignMenus`, payload);
export const assignWidgets = (id: number, payload: AssignWidgetsRequest) =>
  executeAction('POST', `/Roles/${id}/AssignWidgets`, payload);
