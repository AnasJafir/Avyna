import {
  Button,
  Form,
  Image,
  Input,
  ScrollView,
  SizableText,
  Spinner,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import React from 'react';
import { useLogin } from '~/hooks/api';
import { useAuthStore } from '~/store/store';
import { Toast } from 'toastify-react-native';
import { HTTPError } from 'ky';

const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
    })
    .email({
      message: 'Invalid email address',
    }),
  password: z.string().min(6, 'Password must be at least 6 characters long'),
});

const Login = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useRouter();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  const user = useAuthStore();

  const login = useLogin();

  const onSubmit = form.handleSubmit((data) => {
    login.mutate(data, {
      onSuccess: (data) => {
        user.setUser(data);
        navigate.push('/(home)');
      },
      onError: async (error) => {
        if (error instanceof HTTPError) {
          const response = await error.response.json<{ error: string }>();
          Toast.error(response.error);
        }
      },
    });
  });

  console.log('Form errors:', form.formState.errors);

  return (
    <ScrollView backgroundColor={'white'}>
      <YStack backgroundColor={'white'} flex={1}>
        <XStack marginTop={'$10'} justifyContent="center" backgroundColor={'white'}>
          <Image src={require('../../assets/meditate.png')} />
        </XStack>
        <YStack backgroundColor={'white'} flex={1}>
          <Form flex={1} onSubmit={onSubmit}>
            <YStack gap={10} backgroundColor={'white'} padding={'$3'}>
              <XStack backgroundColor={'white'}>
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <Input
                        borderWidth={0}
                        backgroundColor={'white'}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Email"
                        height={50}
                        flex={1}
                        borderStyle="unset"
                        placeholderTextColor={'#734F94'}
                      />
                    );
                  }}
                />
              </XStack>
              {form.formState.errors.email ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.email.message}
                </SizableText>
              ) : null}
              <XStack>
                <Controller
                  control={form.control}
                  name="password"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <View position="relative" flexDirection="row" flex={1}>
                        <Input
                          borderWidth={0}
                          value={value}
                          backgroundColor={'white'}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          textContentType="password"
                          placeholder="Password"
                          height={50}
                          flex={1}
                          borderStyle="unset"
                          placeholderTextColor={'#734F94'}
                        />
                        {!showPassword && (
                          <Eye
                            onPress={() => setShowPassword(true)}
                            position="absolute"
                            top={15}
                            right={5}
                            color={'#734F94'}
                          />
                        )}
                        {showPassword && (
                          <EyeOff
                            onPress={() => setShowPassword(false)}
                            position="absolute"
                            top={15}
                            right={5}
                            color={'#734F94'}
                          />
                        )}
                      </View>
                    );
                  }}
                />
              </XStack>
              {form.formState.errors.password ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.password.message}
                </SizableText>
              ) : null}
              <YStack>
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <Form.Trigger disabled={login.isPending} asChild>
                    <Button
                      icon={login.isPending ? <Spinner size="small" color={'white'} /> : null}
                      color={'white'}
                      backgroundColor={'#AD73EB'}
                      width={'100%'}
                      borderRadius={'$10'}>
                      Sign in
                    </Button>
                  </Form.Trigger>
                </KeyboardAvoidingView>
              </YStack>
              <XStack gap={4} justifyContent={'center'} alignItems={'center'}>
                <Link href={'/login'}>
                  <SizableText color={'#734f94'}>Forgot Password</SizableText>
                </Link>
              </XStack>
              <XStack gap={4} justifyContent={'center'} alignItems={'center'}>
                <SizableText color={'#734f94'}>Don&apos;t have an account?</SizableText>
                <Link href={'/register'}>
                  <SizableText color={'#734f94'}>Register</SizableText>
                </Link>
              </XStack>
              <View backgroundColor={'red'} style={{ flex: 1 }} />
            </YStack>
          </Form>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default Login;
