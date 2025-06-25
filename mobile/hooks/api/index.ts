import { useMutation, useQuery } from '@tanstack/react-query';
import { to } from 'await-to-ts';
import { env } from '~/config/env';
import ky from 'ky';
import { EditProfile, HealthLog, HealthLogResponse, Profile, Recommendation, User } from '~/types';
import { useAuthStore } from '~/store/store';

export const useRegister = () => {
  const user = useAuthStore();
  return useMutation({
    mutationKey: ['register'],
    mutationFn: async (payload: { email: string; password: string; fullName: string }) => {
      const [error, data] = await to(
        ky.post(`${env.baseUrl}/auth/register`, {
          json: { ...payload, full_name: payload.fullName },
        })
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
    mutationKey: ['login'],
    mutationFn: async (payload: { email: string; password: string }) => {
      const [error, data] = await to(
        ky.post(`${env.baseUrl}/auth/login`, {
          json: payload,
        })
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
    mutationKey: ['change_password'],
    mutationFn: async (payload: { current_password: string; new_password: string }) => {
      const [error, data] = await to(
        ky.put(`${env.baseUrl}/profile/change-password`, {
          json: payload,
          headers: {
            Authorization: `Bearer ${user.user?.token}`,
          },
        })
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
    queryKey: ['profile', user.user?.token],
    queryFn: async () => {
      const [error, data] = await to(
        ky.get(`${env.baseUrl}/profile/`, {
          headers: {
            Authorization: `Bearer ${user.user?.token}`,
            'Content-Type': 'application/json',
          },
        })
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
    mutationKey: ['edit_profile'],
    mutationFn: async (payload: EditProfile) => {
      const [error, data] = await to(
        ky.put(`${env.baseUrl}/profile/`, {
          json: payload,
          headers: {
            Authorization: `Bearer ${user.user?.token}`,
          },
        })
      );
      if (error) {
        throw error;
      }
      return data.json<User>();
    },
  });
};

export const useCreateUserSymptoms = () => {
  const user = useAuthStore();
  return useMutation({
    mutationKey: ['symptoms'],
    mutationFn: async (payload: HealthLog) => {
      console.log(payload, 'PPP');
      const [error, data] = await to(
        ky.post(`${env.baseUrl}/symptoms/`, {
          json: payload,
          headers: {
            Authorization: `Bearer ${user.user?.token}`,
          },
        })
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
  console.log(logId, 'ID');
  return useQuery({
    enabled: !!logId,
    queryKey: ['recommendations', logId],
    queryFn: async () => {
      const [error, data] = await to(
        ky(`${env.baseUrl}/recommendations/${logId}`, {
          headers: {
            Authorization: `Bearer ${user.user?.token}`,
            'Content-Type': 'application/json',
          },
        })
      );
      if (error) {
        throw error;
      }
      return data.json<{ recommendation: Recommendation & { generared_at: string } }>();
    },
  });
};
