import { getList } from './resources';
import { mutation, request } from './client';
import { ApiError } from './errors';
import type { Role } from '@/types/api';
import type { AssignedMenu, AssignedWidget } from '@/types/api';
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

export async function getRoleMenus(
  id: number,
  companyId: number,
): Promise<AssignedMenu[]> {
  const data = await request<unknown>('GET', `/Roles/${id}/Menus`, undefined, {
    companyId,
  });
  if (!Array.isArray(data))
    throw new ApiError('The role menu assignment response is invalid.');
  return data.map(decodeAssignedMenu);
}

export async function getRoleWidgets(
  id: number,
  companyId: number,
): Promise<AssignedWidget[]> {
  const data = await request<unknown>('GET', `/Roles/${id}/Widgets`, undefined, {
    companyId,
  });
  if (!Array.isArray(data))
    throw new ApiError('The role widget assignment response is invalid.');
  return data.map(decodeAssignedWidget);
}

function decodeAssignedMenu(value: unknown): AssignedMenu {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The assigned menu response returned an unsupported format.');
  const menu = value as AssignedMenu;
  if (
    !Number.isInteger(menu.menuId) ||
    typeof menu.menuCode !== 'string' ||
    typeof menu.displayName !== 'string' ||
    !Number.isInteger(menu.moduleId) ||
    typeof menu.isVisible !== 'boolean'
  )
    throw new ApiError('The assigned menu response is missing required fields.');
  return menu;
}

function decodeAssignedWidget(value: unknown): AssignedWidget {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The assigned widget response returned an unsupported format.');
  const widget = value as AssignedWidget;
  if (
    !Number.isInteger(widget.widgetId) ||
    typeof widget.widgetCode !== 'string' ||
    typeof widget.widgetName !== 'string' ||
    typeof widget.isVisible !== 'boolean' ||
    !Number.isInteger(widget.sortOrder)
  )
    throw new ApiError('The assigned widget response is missing required fields.');
  return widget;
}

export const assignMenus = async (
  id: number,
  companyId: number,
  payload: AssignMenusRequest,
): Promise<{ data: AssignedMenu[]; message: string }> => {
  const result = await mutation('POST', `/Roles/${id}/AssignMenus`, payload, {
    companyId,
  });
  if (!Array.isArray(result.data))
    throw new ApiError('The assigned menu list response is invalid.');
  return { data: result.data.map(decodeAssignedMenu), message: result.message };
};

export const assignWidgets = async (
  id: number,
  companyId: number,
  payload: AssignWidgetsRequest,
): Promise<{ data: AssignedWidget[]; message: string }> => {
  const result = await mutation('POST', `/Roles/${id}/AssignWidgets`, payload, {
    companyId,
  });
  if (!Array.isArray(result.data))
    throw new ApiError('The assigned widget list response is invalid.');
  return { data: result.data.map(decodeAssignedWidget), message: result.message };
};
