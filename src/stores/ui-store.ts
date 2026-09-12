import { create } from 'zustand';
import { persist } from 'zustand/middleware';
export const useUIStore = create<{ collapsed: boolean; toggle: () => void }>()(
  persist(
    (set) => ({
      collapsed: false,
      toggle: () => set((s) => ({ collapsed: !s.collapsed })),
    }),
    { name: 'prodvex-ui', skipHydration: true },
  ),
);
