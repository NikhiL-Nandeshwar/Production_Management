import { ApiError } from './errors';
import { mutation, request } from './client';
import type { Machine } from '@/types/api';
import type { MachinesCreateRequest, MachinesUpdateRequest } from '@/types/requests';

function decodeMachine(value: unknown): Machine {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The machine response returned an unsupported format.');
  const machine = value as Machine;
  if (
    !Number.isInteger(machine.id) ||
    !Number.isInteger(machine.companyId) ||
    typeof machine.machineCode !== 'string' ||
    typeof machine.machineName !== 'string' ||
    typeof machine.machineType !== 'string' ||
    typeof machine.location !== 'string' ||
    typeof machine.isActive !== 'boolean' ||
    typeof machine.createdAt !== 'string'
  )
    throw new ApiError('The machine response is missing required fields.');
  return machine;
}

export async function getAll(companyId: number): Promise<Machine[]> {
  const data = await request<unknown>('GET', '/Machines/GetAll', undefined, {
    companyId,
  });
  if (!Array.isArray(data))
    throw new ApiError('The machines list response is invalid.');
  return data.map(decodeMachine);
}
export const getById = (id: number, companyId: number) =>
  request<unknown>('GET', `/Machines/${id}/GetById`, undefined, { companyId }).then(
    decodeMachine,
  );
export const create = (companyId: number, payload: MachinesCreateRequest) =>
  mutation('POST', '/Machines/Create', payload, { companyId });
export const update = (companyId: number, payload: MachinesUpdateRequest) =>
  mutation('PUT', '/Machines/Update', payload, { companyId });
export const toggleActive = (id: number, companyId: number) =>
  mutation('PATCH', `/Machines/${id}/toggle-active`, undefined, { companyId });
