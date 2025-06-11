import {
  onlineManager,
  focusManager,
  QueryClient,
  QueryClientProvider,
  QueryCache,
} from '@tanstack/react-query';
import * as Network from 'expo-network';
import { useRouter } from 'expo-router';
import { HTTPError } from 'ky';
import React from 'react';
import { AppState, Platform } from 'react-native';
import type { AppStateStatus } from 'react-native';

onlineManager.setEventListener((setOnline) => {
  const eventSubscription = Network.addNetworkStateListener((state) => {
    setOnline(!!state.isConnected);
  });
  return eventSubscription.remove;
});

const onAppStateChange = (status: AppStateStatus) => {
  if (Platform.OS !== 'web') {
    focusManager.setFocused(status === 'active');
  }
};

export const AsyncProvider = ({ children }: { children: React.ReactNode }) => {
  const navigation = useRouter();
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          mutations: {
            onError: (error) => {
              if (error instanceof HTTPError) {
                const statusCode = error.response.status;
                if (statusCode === 401) {
                  navigation.push('/login');
                }
              }
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error) => {
            if (error instanceof HTTPError) {
              const statusCode = error.response.status;
              if (statusCode === 401) {
                navigation.push('/login');
              }
            }
          },
        }),
      })
  );

  React.useEffect(() => {
    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, []);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};
