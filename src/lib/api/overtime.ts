// Endpoints omitted here were not documented. Do not infer controller conventions.
import { getList } from './resources';
export const getAll = (params?: Record<string, unknown>) =>
  getList('overtime', '/Overtime/GetAll', params);
import { executeAction } from './resources';
export { previewOvertime as preview } from './resources';
export const fromAttendance = (id: number) =>
  executeAction('POST', `/Overtime/FromAttendance/${id}`);
export const approve = (id: number) =>
  executeAction('POST', `/Overtime/${id}/Approve`);
export const remove = (id: number) =>
  executeAction('DELETE', `/Overtime/${id}/Delete`);
