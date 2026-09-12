// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { AttendanceCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: AttendanceCreateRequest) =>
  saveRecord('/Attendance/Create', payload);
import { getList } from './resources';
export const getAll = (params?: Record<string, unknown>) =>
  getList('attendance', '/Attendance/GetAll', params);
