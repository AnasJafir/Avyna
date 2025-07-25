import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import React from "react";
import { TamaguiProvider } from "tamagui";
import ToastManager from "toastify-react-native";
import { AsyncProvider } from "~/providers/async-provider";
import { useAuthStore, useOnboardStore } from "~/store/store";
import config from "../tamagui.config";

const Layout = () => {
	const [loaded] = useFonts({
		Inter: require("@tamagui/font-inter/otf/Inter-Medium.otf"),
		InterBold: require("@tamagui/font-inter/otf/Inter-Bold.otf"),
		Manrope: require("@expo-google-fonts/manrope/200ExtraLight/Manrope_200ExtraLight.ttf"),
		ManropeLight: require("@expo-google-fonts/manrope/300Light/Manrope_300Light.ttf"),
		ManropeRegular: require("@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf"),
		ManropeMedium: require("@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf"),
		ManropeSemiBold: require("@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf"),
		ManropeBold: require("@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf"),
		ManropeExtraBold: require("@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf"),
	});

	const onBoard = useOnboardStore();
	const auth = useAuthStore();

	React.useEffect(() => {
		if (loaded) {
			SplashScreen.hideAsync();
		}
	}, [loaded]);

	if (!loaded) return null;
	console.log(onBoard.hasSeen.seen);

	return (
		<AsyncProvider>
			<TamaguiProvider config={config}>
				<Stack screenOptions={{ headerShown: false }}>
					<Stack.Screen name="(onboarding)" />
					<Stack.Protected guard={onBoard.hasSeen.seen}>
						<Stack.Screen name="(session)" />
					</Stack.Protected>
					<Stack.Protected guard={onBoard.hasSeen.seen && auth.isLoggedIn}>
						<Stack.Screen name="(home)" />
					</Stack.Protected>
					<Stack.Screen name="+not-found" />
				</Stack>
			</TamaguiProvider>
			<ToastManager />
		</AsyncProvider>
	);
};

export default Layout;
