import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { to } from "await-to-ts";
import * as FileSystem from "expo-file-system";
import ky from "ky";
import { env } from "~/config/env";
import { useAuthStore } from "~/store/store";
import type {
	EditProfile,
	HealthLog,
	HealthLogResponse,
	Profile,
	Recommendation,
	Symptom,
	User,
} from "~/types";

export const useRegister = () => {
	const user = useAuthStore();
	return useMutation({
		mutationKey: ["register"],
		mutationFn: async (payload: {
			email: string;
			password: string;
			fullName: string;
		}) => {
			const [error, data] = await to(
				ky.post(`${env.baseUrl}/auth/register`, {
					json: { ...payload, full_name: payload.fullName },
				}),
			);
			if (error) {
				throw error;
			}
			return data.json<User>();
		},
		onSuccess: (data) => {
			user.setUser(data);
		},
	});
};

export const useLogin = () => {
	const user = useAuthStore();
	return useMutation({
		mutationKey: ["login"],
		mutationFn: async (payload: { email: string; password: string }) => {
			const [error, data] = await to(
				ky.post(`${env.baseUrl}/auth/login`, {
					json: payload,
				}),
			);

			if (error) {
				throw error;
			}
			return data.json<User>();
		},
		onSuccess: (data) => {
			user.setUser(data);
		},
	});
};

export const useChangePassword = () => {
	const user = useAuthStore();
	return useMutation({
		mutationKey: ["change_password"],
		mutationFn: async (payload: {
			current_password: string;
			new_password: string;
		}) => {
			const [error, data] = await to(
				ky.put(`${env.baseUrl}/profile/change-password`, {
					json: payload,
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
					},
				}),
			);

			if (error) {
				throw error;
			}
			return data.json<{ message: string }>();
		},
	});
};

export const useGetProfile = () => {
	const user = useAuthStore();
	return useQuery({
		enabled: !!user.user?.token,
		queryKey: ["profile", user.user?.token],
		queryFn: async () => {
			const [error, data] = await to(
				ky.get(`${env.baseUrl}/profile/`, {
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
						"Content-Type": "application/json",
					},
				}),
			);
			if (error) {
				console.log(error);
				throw error;
			}
			return data.json<Profile>();
		},
	});
};
export const useEditProfile = () => {
	const user = useAuthStore();
	return useMutation({
		mutationKey: ["edit_profile"],
		mutationFn: async (payload: Omit<EditProfile, "profile_picture_url">) => {
			const [error, data] = await to(
				ky.put(`${env.baseUrl}/profile/`, {
					json: payload,
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
					},
				}),
			);
			if (error) {
				throw error;
			}
			return data.json<User>();
		},
	});
};

export const useUploadProfilePic = () => {
	const token = useAuthStore();
	const queryClient = useQueryClient();
	return useMutation({
		mutationKey: ["upload_profile"],
		mutationFn: async ({ fileUrl }: { fileUrl: string }) => {
			const [error, response] = await to(
				FileSystem.uploadAsync(
					`${env.baseUrl}/profile/upload-picture`,
					fileUrl,
					{
						fieldName: "profile_picture",
						httpMethod: "POST",
						uploadType: FileSystem.FileSystemUploadType.MULTIPART,
						headers: {
							Authorization: `Bearer ${token.user?.token}`,
						},
					},
				),
			);
			if (error) {
				console.error(error);
				throw error;
			}
			return response.body;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ["profile", token.user?.token],
			});
		},
	});
};

export const useGetAllSymptoms = ({
	offset = 0,
}: {
	offset?: number | undefined;
} = {}) => {
	const user = useAuthStore();
	return useQuery({
		queryKey: ["all_symptoms"],
		queryFn: async () => {
			const [error, response] = await to(
				ky(`${env.baseUrl}/symptoms/?offset=${offset}`, {
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
					},
				}),
			);
			if (error) {
				throw error;
			}

			const data = await response.json<{ logs: Symptom[] }>();
			const logs = data.logs;
			const groupLogs = logs.reduce(
				(acc, curr) => {
					if (Object.hasOwn(acc, curr.date)) {
						acc[curr.date].push(curr);
					} else {
						acc[curr.date] = [curr];
					}
					return acc;
				},
				{} as Record<string, Symptom[]>,
			);
			const boxLogs = [];
			for (const key in groupLogs) {
				boxLogs.push({
					title: key,
					data: groupLogs[key],
				});
			}
			return boxLogs ?? [];
		},
	});
};

export const useCreateUserSymptoms = () => {
	const user = useAuthStore();
	return useMutation({
		mutationKey: ["symptoms"],
		mutationFn: async (payload: HealthLog) => {
			console.log(payload, "PPP");
			const [error, data] = await to(
				ky.post(`${env.baseUrl}/symptoms/`, {
					json: payload,
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
					},
				}),
			);

			if (error) {
				throw error;
			}

			return data.json<HealthLogResponse>();
		},
	});
};

export const useGetRecommendation = (logId: number) => {
	const user = useAuthStore();
	console.log(logId, "ID");
	return useQuery({
		enabled: !!logId,
		queryKey: ["recommendations", logId],
		queryFn: async () => {
			const [error, data] = await to(
				ky(`${env.baseUrl}/recommendations/${logId}`, {
					headers: {
						Authorization: `Bearer ${user.user?.token}`,
						"Content-Type": "application/json",
					},
				}),
			);
			if (error) {
				throw error;
			}
			return data.json<{
				recommendation: Recommendation & { generared_at: string };
			}>();
		},
	});
};
