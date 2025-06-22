import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { mmkvStorage } from '~/lib/storage';
import { EnumProfile, User } from '~/types';

type EditProfile = {
  showProfile: EnumProfile;
  setShowProfile: (value: EnumProfile) => void;
};

type OnBoardState = {
  hasSeen: boolean | undefined;
  setHasSeen: (value: boolean) => void;
};

type AuthState = {
  user: User | undefined | null;
  setUser: (user: User) => void;
  deleteUser: () => void;
};

export const useEditProfileStore = create<EditProfile>()((set) => ({
  showProfile: EnumProfile.Profile,
  setShowProfile: (value: EnumProfile) => set(() => ({ showProfile: value })),
}));

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
