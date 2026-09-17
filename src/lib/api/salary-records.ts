import { mutation, request } from './client';
import { ApiError } from './errors';
import type { SalaryRecord, SalaryRecordPage } from '@/types/api';
import type {
  GenerateBulkSalaryRequest,
  GenerateSingleSalaryRequest,
  SalaryRecordListParams,
} from '@/types/requests';

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function hasNumber(record: Record<string, unknown>, key: string) {
  return typeof record[key] === 'number' && Number.isFinite(record[key]);
}

export function decodeSalaryRecord(value: unknown): SalaryRecord {
  if (!isRecord(value))
    throw new ApiError('The salary record response returned an unsupported format.');
  const integers = ['id', 'companyId', 'userId', 'periodMonth', 'periodYear'];
  const numbers = [
    'salaryPerHourSnapshot',
    'totalWorkHours',
    'totalOtHours',
    'baseAmount',
    'overtimeAmount',
    'incentiveAmount',
    'deductionAmount',
    'finalAmount',
  ];
  if (
    integers.some((key) => !Number.isInteger(value[key])) ||
    numbers.some((key) => !hasNumber(value, key)) ||
    ['userName', 'displayName', 'fromDate', 'toDate', 'status', 'createdAt'].some(
      (key) => typeof value[key] !== 'string',
    ) ||
    !Object.hasOwn(value, 'approvedBy') ||
    !Object.hasOwn(value, 'approvedAt')
  )
    throw new ApiError('The salary record response is missing required fields.');
  return value as unknown as SalaryRecord;
}

export function decodeSalaryRecordPage(value: unknown): SalaryRecordPage {
  if (!isRecord(value) || !Array.isArray(value.items))
    throw new ApiError('The salary report returned an unsupported response format.');
  if (
    !Number.isInteger(value.pageNumber) ||
    !Number.isInteger(value.pageSize) ||
    !Number.isInteger(value.totalCount)
  )
    throw new ApiError('The salary report response is missing pagination fields.');
  return {
    items: value.items.map(decodeSalaryRecord),
    pageNumber: value.pageNumber as number,
    pageSize: value.pageSize as number,
    totalCount: value.totalCount as number,
  };
}

export const getSalaryRecords = (params: SalaryRecordListParams) =>
  request<unknown>('GET', '/SalaryRecords/GetAll', undefined, { ...params }).then(
    decodeSalaryRecordPage,
  );

export const generateSingleSalary = async (
  companyId: number,
  payload: GenerateSingleSalaryRequest,
) => {
  const result = await mutation('POST', '/SalaryRecords/GenerateSingle', payload, {
    companyId,
  });
  return { ...result, data: decodeSalaryRecord(result.data) };
};

export const generateBulkSalary = async (
  companyId: number,
  payload: GenerateBulkSalaryRequest,
) => {
  const result = await mutation('POST', '/SalaryRecords/GenerateBulk', payload, {
    companyId,
  });
  if (!Array.isArray(result.data))
    throw new ApiError('The bulk salary response returned an unsupported format.');
  return { ...result, data: result.data.map(decodeSalaryRecord) };
};
