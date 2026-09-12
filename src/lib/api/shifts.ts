// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { ShiftsCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: ShiftsCreateRequest) =>
  saveRecord('/Shifts/Create', payload);
import { getList } from './resources';
export const getAll = (params?: Record<string, unknown>) =>
  getList('shifts', '/Shifts/GetAll', params);
import { executeAction } from './resources';
export const toggleActive = (id: number) =>
  executeAction('PATCH', `/Shifts/${id}/toggle-active`);
export const remove = (id: number) =>
  executeAction('DELETE', `/Shifts/${id}/Delete`);
