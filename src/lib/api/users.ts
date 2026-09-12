// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { UsersCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: UsersCreateRequest) =>
  saveRecord('/Users/Create', payload);
