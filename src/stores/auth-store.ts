import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AuthSession } from '@/types/api';
type State = {
  session: AuthSession | null;
  setSession: (session: AuthSession) => void;
  clear: () => void;
};
export const useAuthStore = create<State>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      clear: () => set({ session: null }),
    }),
    {
      name: 'prodvex-session',
      storage: createJSONStorage(() => sessionStorage),
      skipHydration: true,
      // Refresh tokens remain in memory; reloading never persists a long-lived credential.
      partialize: (state) => ({
        session: state.session
          ? { ...state.session, refreshToken: undefined }
          : null,
      }),
    },
  ),
);

/** Clear both the in-memory Zustand state and its persisted browser-tab copy. */
export function clearAuthSession() {
  useAuthStore.getState().clear();
  useAuthStore.persist.clearStorage();
}
