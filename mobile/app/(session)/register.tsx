import {
  Button,
  Form,
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
import { CheckboxWithLabel } from '~/components/checkbox';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import React from 'react';
import { useRegister } from '~/hooks/api';
import { Toast } from 'toastify-react-native';
import { HTTPError } from 'ky';

const registerSchema = z
  .object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z
      .string({
        required_error: 'Email is required',
      })
      .email({
        message: 'Invalid email address',
      }),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Password must be at least 6 characters long'),
    acceptTerms: z
      .boolean({
        required_error: 'You must accept the terms and conditions',
      })
      .refine((value) => value === true, {
        message: 'You must accept the terms and conditions',
      }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords must match',
  });

const Register = () => {
  const navigate = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const register = useRegister();

  const onSubmit = form.handleSubmit((data) => {
    register.mutate(data, {
      onSuccess: () => {
        Toast.success('Registration successful! Please log in.');
        navigate.replace('/login');
      },
      onError: async (error) => {
        if (error instanceof HTTPError) {
          const response = await error.response.json<{ error: string }>();
          Toast.error(response.error);
        }
      },
    });
  });

  return (
    <ScrollView backgroundColor={'white'}>
      <YStack backgroundColor={'white'} flex={1}>
        <YStack backgroundColor={'white'} flex={1} marginTop={'$10'}>
          <Form flex={1} onSubmit={onSubmit}>
            <YStack gap={10} backgroundColor={'white'} padding={'$3'}>
              <XStack backgroundColor={'white'}>
                <Controller
                  control={form.control}
                  name="fullName"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <Input
                        borderWidth={0}
                        backgroundColor={'#EDE8F2'}
                        value={value}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Full Name"
                        height={50}
                        flex={1}
                        borderStyle="unset"
                        placeholderTextColor={'#734F94'}
                      />
                    );
                  }}
                />
              </XStack>
              {form.formState.errors.fullName ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.fullName.message}
                </SizableText>
              ) : null}

              <XStack backgroundColor={'white'}>
                <Controller
                  control={form.control}
                  name="email"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <Input
                        borderWidth={0}
                        backgroundColor={'#EDE8F2'}
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
                          backgroundColor={'#EDE8F2'}
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
              <XStack>
                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <View position="relative" flexDirection="row" flex={1}>
                        <Input
                          borderWidth={0}
                          value={value}
                          backgroundColor={'#EDE8F2'}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          textContentType="password"
                          placeholder="Confirm Password"
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
              {form.formState.errors.confirmPassword ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.confirmPassword.message}
                </SizableText>
              ) : null}
              <XStack>
                <Controller
                  control={form.control}
                  name="acceptTerms"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <CheckboxWithLabel
                        labelSize={'$2'}
                        onBlur={onBlur}
                        onCheckedChange={onChange}
                        value={value as any}
                        label="I agree to the Terms of Service and Privacy Policy"
                      />
                    );
                  }}
                />
              </XStack>
              {form.formState.errors.acceptTerms ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.acceptTerms.message}
                </SizableText>
              ) : null}
              <YStack>
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <Form.Trigger disabled={register.isPending} asChild>
                    <Button
                      icon={register.isPending ? <Spinner size="small" color={'white'} /> : null}
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
                <SizableText size={'$2'} color={'#734F94'}>
                  Already have an Account?
                </SizableText>
                <Link href={'/login'}>
                  <SizableText color={'#734f94'}>Sign In</SizableText>
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

export default Register;
