// Endpoints omitted here were not documented. Do not infer controller conventions.
import type { SalaryRecordsCreateRequest } from '@/types/requests';
import { saveRecord } from './resources';
export const create = (payload: SalaryRecordsCreateRequest) =>
  saveRecord('/SalaryRecords/Generate', payload);
