import type { AuthSession, DataRow } from '@/types/api';
// Fill ONLY from verified Swagger or real response samples. No guessed wrapper keys.
export const decodeRefresh:
  ((payload: unknown, current: AuthSession) => AuthSession) | null = null;
export type ListContract = {
  rows: (payload: unknown) => DataRow[];
  total?: (payload: unknown) => number;
  idField?: string;
};
export const listContracts: Record<string, ListContract> = {};
// Action permission fields are absent from the provided login schema. Return null
// for unknown; the backend authorizes documented commands. Never infer from role names.
export const decodeActionPermission:
  | ((route: string, action: string, session: AuthSession) => boolean | null)
  | null = null;
