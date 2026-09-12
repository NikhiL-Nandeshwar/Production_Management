import { request, mutation } from './client';
import { listContracts } from '@/config/contracts';
import { ApiError } from './errors';
import type { DataRow } from '@/types/api';
export function isRow(value: unknown): value is DataRow {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
export function decodeRows(resource: string, payload: unknown) {
  const contract = listContracts[resource];
  if (contract)
    return { rows: contract.rows(payload), total: contract.total?.(payload) };
  if (Array.isArray(payload) && payload.every(isRow))
    return { rows: payload, total: undefined };
  throw new ApiError(
    'The list response needs a verified adapter. See docs/API-CONTRACTS.md.',
  );
}
export async function getList(
  resource: string,
  url: string,
  params?: Record<string, unknown>,
) {
  return decodeRows(resource, await request('GET', url, undefined, params));
}
export const saveRecord = (url: string, body: unknown) =>
  mutation('POST', url, body);
export const executeAction = (
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
) => mutation(method, url, body);
export const previewOvertime = (attendanceId: number) =>
  request('GET', `/Overtime/Preview/${attendanceId}`);
export const uploadLogo = (companyId: number, file: File) => {
  const data = new FormData();
  data.append('logo', file);
  return mutation('POST', `/Companies/${companyId}/UploadLogo`, data);
};
