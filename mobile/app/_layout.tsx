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
    Space: require('@expo-google-fonts/space-grotesk/400Regular/SpaceGrotesk_400Regular.ttf'),
    SpaceMedium: require('@expo-google-fonts/space-grotesk/500Medium/SpaceGrotesk_500Medium.ttf'),
    SpaceBold: require('@expo-google-fonts/space-grotesk/700Bold/SpaceGrotesk_700Bold.ttf'),
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
