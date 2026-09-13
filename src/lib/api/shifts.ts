import { ApiError } from './errors';
import { mutation, request } from './client';
import type { Shift } from '@/types/api';
import type { ShiftsCreateRequest, ShiftsUpdateRequest } from '@/types/requests';

function decodeShift(value: unknown): Shift {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The shift response returned an unsupported format.');
  const shift = value as Shift;
  if (
    !Number.isInteger(shift.id) ||
    !Number.isInteger(shift.companyId) ||
    typeof shift.shiftName !== 'string' ||
    typeof shift.startTime !== 'string' ||
    typeof shift.endTime !== 'string' ||
    !Number.isInteger(shift.breakMinutes) ||
    typeof shift.isActive !== 'boolean' ||
    typeof shift.createdAt !== 'string'
  )
    throw new ApiError('The shift response is missing required fields.');
  return shift;
}

export async function getAll(companyId: number): Promise<Shift[]> {
  const data = await request<unknown>('GET', '/Shifts/GetAll', undefined, {
    companyId,
    onlyActive: false,
  });
  if (!Array.isArray(data))
    throw new ApiError('The shifts list response is invalid.');
  return data.map(decodeShift);
}
export const getById = (id: number, companyId: number) =>
  request<unknown>('GET', `/Shifts/${id}/GetById`, undefined, { companyId }).then(
    decodeShift,
  );
export const create = (companyId: number, payload: ShiftsCreateRequest) =>
  mutation('POST', '/Shifts/Create', payload, { companyId });
export const update = (companyId: number, payload: ShiftsUpdateRequest) =>
  mutation('PUT', '/Shifts/Update', payload, { companyId });
export const toggleActive = (id: number, companyId: number) =>
  mutation('PATCH', `/Shifts/${id}/toggle-active`, undefined, { companyId });
