// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { RejectionEntriesCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: RejectionEntriesCreateRequest) =>
  saveRecord('/RejectionEntries/Create', payload);
