// Endpoints omitted here were not documented. Do not infer controller conventions.
import { executeAction } from './resources';
import type { CloseDowntimeRequest } from '@/types/requests';
export const close = (payload: CloseDowntimeRequest) =>
  executeAction('POST', '/DowntimeEntries/Close', payload);
