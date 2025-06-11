import { useMutation, useQuery } from '@tanstack/react-query';
import { to } from 'await-to-ts';
import { env } from '~/config/env';
import ky from 'ky';
import { HealthLog, HealthLogResponse, Recommendation } from '~/types';
import { useAuthStore } from '~/store/store';

export const useRegister = () => {
  return useMutation({
    mutationKey: ['register'],
    mutationFn: async (payload: { email: string; password: string }) => {
      const [error, data] = await to(
        ky.post(`${env.baseUrl}/auth/register`, {
          json: payload,
        })
      );
      if (error) {
        throw error;
      }

      return data.json<{ message: string }>();
    },
  });
};

export const useLogin = () => {
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
      return data.json<{ token: string }>();
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
