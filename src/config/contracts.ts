import type { AuthSession, DataRow } from '@/types/api';
import { ApiError } from '@/lib/api/errors';
// Fill ONLY from verified Swagger or real response samples. No guessed wrapper keys.
export const decodeRefresh:
  ((payload: unknown, current: AuthSession) => AuthSession) | null = null;
export type ListContract = {
  rows: (payload: unknown) => DataRow[];
  total?: (payload: unknown) => number;
  idField?: string;
};
export const listContracts: Record<string, ListContract> = {
  roles: {
    rows: (payload) => {
      if (!Array.isArray(payload) || payload.some((row) => !isDataRow(row)))
        throw new ApiError('The roles list returned an unsupported response format.');
      return payload;
    },
    idField: 'id',
  },
  users: {
    rows: (payload) => {
      if (!Array.isArray(payload) || payload.some((row) => !isDataRow(row)))
        throw new ApiError('The users list returned an unsupported response format.');
      return payload;
    },
    idField: 'id',
  },
};

function isDataRow(value: unknown): value is DataRow {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
// Action permission fields are absent from the provided login schema. Return null
// for unknown; the backend authorizes documented commands. Never infer from role names.
export const decodeActionPermission:
  | ((route: string, action: string, session: AuthSession) => boolean | null)
  | null = null;
