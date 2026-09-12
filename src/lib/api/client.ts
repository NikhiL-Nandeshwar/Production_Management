import axios from 'axios';
import { clearAuthSession, useAuthStore } from '@/stores/auth-store';
import { ApiError, safeMessage } from './errors';
import type { ApiResponse, AuthSession } from '@/types/api';
const baseURL =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'https://prodvex.runasp.net/api/v1';
export const transport = axios.create({ baseURL, timeout: 25000 });
export function expireSession() {
  clearAuthSession();
  if (typeof window !== 'undefined' && window.location.pathname != '/login')
    window.location.replace('/login');
}
let refreshing: Promise<void> | null = null;
let sessionEpoch = 0;
export function invalidateSession() {
  sessionEpoch++;
  expireSession();
}
// Refresh response is not documented. Automatic refresh is deliberately disabled until
// decodeRefresh is configured against a verified backend contract (see contracts.ts).
export async function refreshSession() {
  const { decodeRefresh } = await import('@/config/contracts');
  const session = useAuthStore.getState().session;
  if (!decodeRefresh || !session?.refreshToken) {
    expireSession();
    return;
  }
  if (!refreshing) {
    const epoch = sessionEpoch;
    refreshing = transport
      .post<ApiResponse<unknown>>('/Auth/refresh', {
        refreshToken: session.refreshToken,
      })
      .then(({ data }) => {
        if (!data.success) throw new ApiError('Your session has expired.', 401);
        const next = decodeRefresh(data.data, session);
        if (
          epoch === sessionEpoch &&
          useAuthStore.getState().session?.accessToken === session.accessToken
        )
          useAuthStore.getState().setSession(next);
      })
      .catch(() => {
        expireSession();
      })
      .finally(() => {
        refreshing = null;
      });
  }
  await refreshing;
}
transport.interceptors.request.use(async (config) => {
  const publicRequest = ['/Auth/login', '/Auth/refresh'].includes(
    config.url || '',
  );
  if (!publicRequest) {
    let session = useAuthStore.getState().session;
    if (
      session &&
      Date.parse(session.accessTokenExpiresAt) <= Date.now() + 30000 &&
      config.url != '/Auth/logout'
    ) {
      await refreshSession();
      session = useAuthStore.getState().session;
    }
    if (!session) throw new ApiError('Please sign in again.', 401);
    config.headers.Authorization = `Bearer ${session.accessToken}`;
  }
  return config;
});
transport.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof ApiError) return Promise.reject(error);
    const status = error.response?.status || 0;
    if (status === 401 && error.config?.url != '/Auth/login') expireSession();
    const raw = error.response?.data;
    const fields: Record<string, string[]> = {};
    if (
      raw?.errors &&
      typeof raw.errors === 'object' &&
      !Array.isArray(raw.errors)
    )
      for (const [key, val] of Object.entries(raw.errors))
        if (Array.isArray(val)) fields[key] = val.map((x) => safeMessage(x));
    const fallback =
      status === 0
        ? 'Cannot reach PRODVEX. Check your connection and API CORS settings.'
        : status === 401
          ? 'Your session has expired or your credentials are incorrect.'
          : status === 403
            ? 'You do not have permission to perform this action.'
            : status === 404
              ? 'The requested record was not found.'
              : status === 409
                ? 'This record conflicts with another change. Refresh and try again.'
                : status >= 500
                  ? 'The server could not complete the request. Please try again later.'
                  : 'The request could not be completed.';
    return Promise.reject(
      new ApiError(
        status >= 500 ? fallback : safeMessage(raw?.message, fallback),
        status,
        fields,
      ),
    );
  },
);
function validateEnvelope<T>(data: ApiResponse<T>): ApiResponse<T> {
  if (typeof data?.success !== 'boolean')
    throw new ApiError('The server returned an unsupported response format.');
  if (!data.success) {
    if (data.statusCode === 401) expireSession();
    const fields: Record<string, string[]> = {};
    if (data.errors && !Array.isArray(data.errors))
      for (const [key, values] of Object.entries(data.errors))
        if (Array.isArray(values))
          fields[key] = values.map((v) => safeMessage(v));
    const details = Array.isArray(data.errors)
      ? data.errors.map((v) => safeMessage(v)).join(' ')
      : '';
    const message =
      data.statusCode >= 500
        ? 'The server could not complete the request.'
        : safeMessage(data.message);
    throw new ApiError(
      details ? safeMessage(message + ' ' + details, message) : message,
      data.statusCode,
      fields,
    );
  }
  return data;
}
export async function request<T>(
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
): Promise<T> {
  const { data } = await transport.request<ApiResponse<T>>({
    method,
    url,
    data: body,
    params,
  });
  return validateEnvelope(data).data;
}
export async function mutation(
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE',
  url: string,
  body?: unknown,
  params?: Record<string, unknown>,
) {
  const response = await transport.request<ApiResponse<unknown>>({
    method,
    url,
    data: body,
    params,
  });
  const data = validateEnvelope(response.data);
  return {
    data: data.data,
    message: safeMessage(data.message, 'Saved successfully.'),
  };
}
export function decodeLogin(value: unknown): AuthSession {
  if (!value || typeof value !== 'object')
    throw new ApiError('Login returned an unsupported session.');
  const s = value as AuthSession;
  if (
    !Number.isInteger(s.userId) ||
    s.userId <= 0 ||
    typeof s.username !== 'string' ||
    typeof s.displayName !== 'string' ||
    typeof s.email !== 'string' ||
    (s.companyId !== null &&
      (!Number.isInteger(s.companyId) || s.companyId <= 0)) ||
    typeof s.companyName !== 'string' ||
    !Number.isInteger(s.roleId) ||
    s.roleId <= 0 ||
    typeof s.roleName !== 'string' ||
    typeof s.accessToken !== 'string' ||
    !s.accessToken ||
    typeof s.refreshToken !== 'string' ||
    !s.refreshToken ||
    typeof s.isSuperAdmin !== 'boolean' ||
    !Array.isArray(s.sidebar) ||
    !Array.isArray(s.myWidgets) ||
    !Number.isFinite(Date.parse(s.accessTokenExpiresAt)) ||
    !Number.isFinite(Date.parse(s.refreshTokenExpiresAt || ''))
  )
    throw new ApiError('Login response is missing required session fields.');
  if (Date.parse(s.accessTokenExpiresAt) <= Date.now())
    throw new ApiError('Login returned an expired access token.');
  return s;
}

/** A restored browser-tab session is usable only while its access token is valid. */
export function hasUsableAccessToken(session: AuthSession | null) {
  return !!(
    session &&
    typeof session.accessToken === 'string' &&
    session.accessToken &&
    typeof session.accessTokenExpiresAt === 'string' &&
    Number.isFinite(Date.parse(session.accessTokenExpiresAt)) &&
    Date.parse(session.accessTokenExpiresAt) > Date.now()
  );
}
