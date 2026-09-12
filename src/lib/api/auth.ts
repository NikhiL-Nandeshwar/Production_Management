import { decodeLogin, mutation, invalidateSession } from './client';
import { useAuthStore } from '@/stores/auth-store';
export async function login(username: string, password: string) {
  const result = await mutation('POST', '/Auth/login', { username, password });
  const session = decodeLogin(result.data);
  useAuthStore.getState().setSession(session);
  return { session, message: result.message };
}
export async function logout() {
  const token = useAuthStore.getState().session?.refreshToken;
  try {
    if (token) await mutation('POST', '/Auth/logout', { refreshToken: token });
  } finally {
    invalidateSession();
  }
}
