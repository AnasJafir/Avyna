import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { mmkvStorage } from "~/lib/storage";
import { EnumProfile, type User } from "~/types";

type EditProfile = {
	showProfile: EnumProfile;
	setShowProfile: (value: EnumProfile) => void;
};

type OnBoardState = {
	hasSeen: { step: number; seen: boolean };
	setHasSeen: (value: { step: number; seen: boolean }) => void;
};

type AuthState = {
	user: User | undefined | null;
	isLoggedIn: boolean;
	setUser: (user: User) => void;
	deleteUser: () => void;
	setIsLoggedIn: (isLoggedIn: boolean) => void;
};

export const useEditProfileStore = create<EditProfile>()((set) => ({
	showProfile: EnumProfile.Profile,
	setShowProfile: (value: EnumProfile) => set(() => ({ showProfile: value })),
}));

export const useOnboardStore = create<OnBoardState>()(
	persist(
		(set) => ({
			hasSeen: { step: 1, seen: false },
			setHasSeen: (value: { step: number; seen: boolean }) =>
				set(() => ({ hasSeen: value })),
		}),
		{
			name: "onboard-storage",
			storage: createJSONStorage(() => mmkvStorage),
		},
	),
);

export const useAuthStore = create<AuthState>()(
	persist(
		(set) => ({
			user: undefined,
			isLoggedIn: false,
			setUser: (user) => set(() => ({ user })),
			deleteUser: () => set(() => ({ user: undefined })),
			setIsLoggedIn: (isLoggedIn) => set(() => ({ isLoggedIn })),
		}),
		{
			name: "auth-storage",
			storage: createJSONStorage(() => mmkvStorage),
		},
	),
);
