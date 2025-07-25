import {
	focusManager,
	onlineManager,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from "@tanstack/react-query";
import * as Network from "expo-network";
import { usePathname, useRouter } from "expo-router";
import { HTTPError } from "ky";
import React from "react";
import type { AppStateStatus } from "react-native";
import { AppState, Platform } from "react-native";
import { useAuthStore } from "~/store/store";

onlineManager.setEventListener((setOnline) => {
	const eventSubscription = Network.addNetworkStateListener((state) => {
		setOnline(!!state.isConnected);
	});
	return eventSubscription.remove;
});

const onAppStateChange = (status: AppStateStatus) => {
	if (Platform.OS !== "web") {
		focusManager.setFocused(status === "active");
	}
};

// const ignorePaths = ["/login", "/register", "/welcome", "/onboard"];
export const AsyncProvider = ({ children }: { children: React.ReactNode }) => {
	const navigation = useRouter();
	const auth = useAuthStore();
	const [queryClient] = React.useState(
		() =>
			new QueryClient({
				defaultOptions: {
					mutations: {
						onError: (error) => {
							if (error instanceof HTTPError) {
								const statusCode = error.response.status;
								if (statusCode === 401) {
									auth.setIsLoggedIn(false);
									navigation.push("/login");
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
								navigation.push("/login");
							}
						}
					},
				}),
			}),
	);

	React.useEffect(() => {
		const subscription = AppState.addEventListener("change", onAppStateChange);
		return () => subscription.remove();
	}, []);

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
};
