import { Stack } from 'expo-router';
import { View } from 'tamagui';

const AuthLayout = () => {
  return (
    <Stack>
      <Stack.Screen
        name="login"
        options={{
          headerBackground: () => <View backgroundColor={'white'} flex={1} />,
          headerTransparent: true,
          headerTitle: 'Sign In',
          headerTitleStyle: {
            fontFamily: 'ManropeBold',
          },
          headerTitleAlign: 'center',
        }}
      />
      <Stack.Screen
        name="register"
        options={{
          headerBackground: () => <View backgroundColor={'white'} flex={1} />,
          headerTransparent: true,
          headerTitle: 'Sign Up',
          headerTitleStyle: {
            fontFamily: 'ManropeBold',
          },
          headerTitleAlign: 'center',
        }}
      />
    </Stack>
  );
};

export default AuthLayout;
