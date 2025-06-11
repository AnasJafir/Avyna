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
        name="[log_id]/index"
        options={{
          title: 'AI Recommendations',
          headerShadowVisible: false,
          headerBackVisible: true,
          headerTitleStyle: {
            fontFamily: 'SpaceBold',
          },
        }}
      />
    </Stack>
  );
};

export default TrackLayout;
