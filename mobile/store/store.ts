import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '~/lib/storage';

type OnBoardState = {
  hasSeen: boolean | undefined;
  setHasSeen: (value: boolean) => void;
};

type AppState = {
  count: number;
  increment: () => void;
  decrement: () => void;
};

type AuthState = {
  user: { token: string } | undefined | null;
  setUser: (user: { token: string }) => void;
  deleteUser: () => void;
};

export const useOnboardStore = create<OnBoardState>()(
  persist(
    (set) => ({
      hasSeen: false,
      setHasSeen: (value: boolean) => set(() => ({ hasSeen: value })),
    }),
    {
      name: 'onboard-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: undefined,
      setUser: (user) => set(() => ({ user })),
      deleteUser: () => set(() => ({ user: undefined })),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => mmkvStorage),
    }
  )
);
