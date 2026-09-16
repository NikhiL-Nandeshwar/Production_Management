import { ApiError } from './errors';
import { mutation, request } from './client';
import type { WorkSession } from '@/types/api';
import type {
  WorkSessionsCreateRequest,
  WorkSessionsUpdateRequest,
} from '@/types/requests';

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function decodeWorkSession(value: unknown): WorkSession {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The work session response returned an unsupported format.');
  const session = value as WorkSession;
  const validDowntimes =
    Array.isArray(session.downtimes) &&
    session.downtimes.every(
      (downtime) =>
        !!downtime &&
        Number.isInteger(downtime.id) &&
        Number.isInteger(downtime.downtimeCategoryId) &&
        typeof downtime.categoryName === 'string' &&
        isFiniteNumber(downtime.durationMinutes) &&
        typeof downtime.remarks === 'string',
    );
  if (
    !Number.isInteger(session.id) ||
    !Number.isInteger(session.companyId) ||
    !Number.isInteger(session.operatorUserId) ||
    typeof session.operatorName !== 'string' ||
    typeof session.workDate !== 'string' ||
    !Number.isInteger(session.shiftId) ||
    typeof session.shiftName !== 'string' ||
    !Number.isInteger(session.machineId) ||
    typeof session.machineName !== 'string' ||
    !Number.isInteger(session.componentId) ||
    typeof session.componentName !== 'string' ||
    (session.cycleTimeMinutes !== null && !isFiniteNumber(session.cycleTimeMinutes)) ||
    typeof session.inTime !== 'string' ||
    (session.outTime !== null && typeof session.outTime !== 'string') ||
    !isFiniteNumber(session.normsMinutes) ||
    !isFiniteNumber(session.shiftDurationMinutes) ||
    !isFiniteNumber(session.availableProductionMinutes) ||
    !isFiniteNumber(session.qtyOk) ||
    !isFiniteNumber(session.reworkQty) ||
    !isFiniteNumber(session.machiningRejectionQty) ||
    !isFiniteNumber(session.castingRejectionQty) ||
    !isFiniteNumber(session.totalQty) ||
    !isFiniteNumber(session.machineBreakdownMinutes) ||
    !isFiniteNumber(session.powerOffMinutes) ||
    !isFiniteNumber(session.noLoadMinutes) ||
    !isFiniteNumber(session.settingMinutes) ||
    !isFiniteNumber(session.unloadingMinutes) ||
    !isFiniteNumber(session.overtimeMinutes) ||
    !isFiniteNumber(session.idealQty) ||
    !isFiniteNumber(session.efficiencyPercentage) ||
    !isFiniteNumber(session.actualWorkHours) ||
    typeof session.status !== 'string' ||
    typeof session.createdAt !== 'string' ||
    (session.updatedAt !== null && typeof session.updatedAt !== 'string') ||
    !validDowntimes
  )
    throw new ApiError('The work session response is missing required fields.');
  return session;
}

function decodeWorkSessionList(value: unknown): WorkSession[] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new ApiError('The work sessions list response returned an unsupported format.');
  const data = value as { items?: unknown };
  if (!Array.isArray(data.items))
    throw new ApiError('The work sessions list response is missing items.');
  return data.items.map(decodeWorkSession);
}

export const getAll = (
  companyId: number,
  operatorUserId: number,
  status: 'Open' | 'Completed' = 'Open',
  date?: string,
) =>
  request<unknown>('GET', '/WorkSessions/GetAll', undefined, {
    ...(date ? { FromDate: date, ToDate: date } : {}),
    OperatorUserId: operatorUserId,
    Status: status,
    Page: 1,
    PageSize: 20,
    companyId,
  }).then(decodeWorkSessionList);

export const create = (companyId: number, payload: WorkSessionsCreateRequest) =>
  mutation('POST', '/WorkSessions/Create', payload, { companyId }).then((result) => ({
    ...result,
    data: decodeWorkSession(result.data),
  }));

export const update = (companyId: number, payload: WorkSessionsUpdateRequest) =>
  mutation('PUT', '/WorkSessions/Update', payload, { companyId }).then((result) => ({
    ...result,
    data: decodeWorkSession(result.data),
  }));

export const complete = (companyId: number, id: number) =>
  mutation('PATCH', `/WorkSessions/${id}/Complete`, undefined, { companyId }).then(
    (result) => ({
      ...result,
      data: decodeWorkSession(result.data),
    }),
  );
