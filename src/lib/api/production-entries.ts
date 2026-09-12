// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { ProductionEntriesCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: ProductionEntriesCreateRequest) =>
  saveRecord('/ProductionEntries/Create', payload);
