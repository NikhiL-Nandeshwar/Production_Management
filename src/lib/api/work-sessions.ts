// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { WorkSessionsCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: WorkSessionsCreateRequest) =>
  saveRecord('/WorkSessions/Start', payload);
import { executeAction } from './resources';
import type { CompleteWorkSessionRequest } from '@/types/requests';
export const complete = (payload: CompleteWorkSessionRequest) =>
  executeAction('POST', '/WorkSessions/Complete', payload);
export const cancel = (id: number) =>
  executeAction('POST', `/WorkSessions/${id}/Cancel`);
