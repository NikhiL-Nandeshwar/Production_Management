// Endpoints omitted here were not documented. Do not infer controller conventions.
import { getList } from './resources';
export const getAll = (params?: Record<string, unknown>) =>
  getList('machines', '/Machines/GetAll', params);
