import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import React from 'react';
import { TamaguiProvider } from 'tamagui';

import config from '../tamagui.config';
import { useOnboardStore } from '~/store/store';
import OnBoardScreen from '~/components/onboard';
import { AsyncProvider } from '~/providers/async-provider';
import ToastManager from 'toastify-react-native';

export default function Layout() {
  const [loaded] = useFonts({
    Inter: require('@tamagui/font-inter/otf/Inter-Medium.otf'),
    InterBold: require('@tamagui/font-inter/otf/Inter-Bold.otf'),
    Manrope: require('@expo-google-fonts/manrope/200ExtraLight/Manrope_200ExtraLight.ttf'),
    ManropeLight: require('@expo-google-fonts/manrope/300Light/Manrope_300Light.ttf'),
    ManropeRegular: require('@expo-google-fonts/manrope/400Regular/Manrope_400Regular.ttf'),
    ManropeMedium: require('@expo-google-fonts/manrope/500Medium/Manrope_500Medium.ttf'),
    ManropeSemiBold: require('@expo-google-fonts/manrope/600SemiBold/Manrope_600SemiBold.ttf'),
    ManropeBold: require('@expo-google-fonts/manrope/700Bold/Manrope_700Bold.ttf'),
    ManropeExtraBold: require('@expo-google-fonts/manrope/800ExtraBold/Manrope_800ExtraBold.ttf'),
  });

  const onBoard = useOnboardStore();

  React.useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  React.useLayoutEffect(() => {
    const timout = setTimeout(() => {
      onBoard.setHasSeen(true);
    }, 5000);
    return () => clearTimeout(timout);
  }, [onBoard]);

  if (!loaded) return null;

  if (onBoard.hasSeen === undefined) return null;
  if (onBoard.hasSeen === false) {
    return (
      <TamaguiProvider config={config}>
        <OnBoardScreen />
      </TamaguiProvider>
    );
  }

  return (
    <AsyncProvider>
      <TamaguiProvider config={config}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(home)" />
          <Stack.Screen name="(session)" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </TamaguiProvider>
      <ToastManager />
    </AsyncProvider>
  );
}
