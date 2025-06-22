import { Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'index',
};

const TrackLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="change-password"
        options={{
          title: 'Change password',
          headerShadowVisible: false,
          headerBackVisible: true,
          headerTitleStyle: {
            fontFamily: 'ManropeSemiBold',
          },
        }}
      />
    </Stack>
  );
};

export default TrackLayout;
