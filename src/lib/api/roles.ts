// Endpoints omitted here were not documented. Do not infer controller conventions.
import { getList } from './resources';
export const getAll = (params?: Record<string, unknown>) =>
  getList('roles', '/Roles/GetAll', params);
import { executeAction } from './resources';
import type {
  AssignMenusRequest,
  AssignWidgetsRequest,
} from '@/types/requests';
export const assignMenus = (id: number, payload: AssignMenusRequest) =>
  executeAction('POST', `/Roles/${id}/AssignMenus`, payload);
export const assignWidgets = (id: number, payload: AssignWidgetsRequest) =>
  executeAction('POST', `/Roles/${id}/AssignWidgets`, payload);
