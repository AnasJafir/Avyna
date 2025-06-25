import {
  Button,
  Form,
  Input,
  Label,
  ScrollView,
  SizableText,
  Spinner,
  View,
  YStack,
} from 'tamagui';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff } from '@tamagui/lucide-icons';
import React from 'react';
import { useChangePassword } from '~/hooks/api';
import { Toast } from 'toastify-react-native';
import { HTTPError } from 'ky';

const loginSchema = z
  .object({
    newPassword: z
      .string({
        required_error: 'New password is required',
      })
      .min(6, 'Password must be at least 6 characters long'),
    currentPassword: z.string().min(6, 'Current password must be at least 6 characters long'),
    confirmPassword: z.string().min(6, 'Confirm password must be at least 6 characters long'),
  })
  .refine((check) => check.newPassword === check.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

const ChangePassword = () => {
  const [showPassword, setShowPassword] = React.useState(false);
  const navigate = useRouter();
  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      newPassword: '',
      currentPassword: '',
    },
  });

  const change_pass = useChangePassword();

  const onSubmit = form.handleSubmit((data) => {
    change_pass.mutate(
      { ...data, current_password: data.currentPassword, new_password: data.newPassword },
      {
        onSuccess: (data) => {
          console.log(data);
          Toast.success(data.message);
          navigate.back();
        },
        onError: async (error) => {
          if (error instanceof HTTPError) {
            const response = await error.response.json<{ error: string }>();
            console.log('CP, ', response.error);
            Toast.error(response.error);
          }
        },
      }
    );
  });

  return (
    <ScrollView backgroundColor={'white'}>
      <YStack backgroundColor={'white'} flex={1}>
        <YStack backgroundColor={'white'} flex={1}>
          <Form flex={1} onSubmit={onSubmit}>
            <YStack gap={10} backgroundColor={'white'} padding={'$3'}>
              <YStack>
                <Label color={'#734F94'}>Current Password</Label>
                <Controller
                  control={form.control}
                  name="currentPassword"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <View position="relative" flexDirection="row" flex={1}>
                        <Input
                          borderWidth={0}
                          value={value}
                          backgroundColor={'#F2F0F5'}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          textContentType="password"
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
              </YStack>
              {form.formState.errors.currentPassword ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.currentPassword.message}
                </SizableText>
              ) : null}

              <YStack>
                <Label color={'#734F94'}>New password</Label>
                <Controller
                  control={form.control}
                  name="newPassword"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <View position="relative" flexDirection="row" flex={1}>
                        <Input
                          borderWidth={0}
                          value={value}
                          backgroundColor={'#F2F0F5'}
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
              </YStack>
              {form.formState.errors.newPassword ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.newPassword.message}
                </SizableText>
              ) : null}

              <YStack>
                <Label color={'#734F94'}>Confirm password</Label>
                <Controller
                  control={form.control}
                  name="confirmPassword"
                  render={({ field: { value, onBlur, onChange } }) => {
                    return (
                      <View position="relative" flexDirection="row" flex={1}>
                        <Input
                          borderWidth={0}
                          value={value}
                          backgroundColor={'#F2F0F5'}
                          onBlur={onBlur}
                          onChangeText={onChange}
                          secureTextEntry={!showPassword}
                          textContentType="password"
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
              </YStack>
              {form.formState.errors.confirmPassword ? (
                <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                  {form.formState.errors.confirmPassword.message}
                </SizableText>
              ) : null}
              <YStack>
                <KeyboardAvoidingView
                  style={{ flex: 1 }}
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                  <Form.Trigger disabled={change_pass.isPending} asChild>
                    <Button
                      icon={change_pass.isPending ? <Spinner size="small" color={'white'} /> : null}
                      color={'white'}
                      backgroundColor={'#AD73EB'}
                      width={'100%'}
                      borderRadius={'$10'}>
                      Save
                    </Button>
                  </Form.Trigger>
                </KeyboardAvoidingView>
              </YStack>
            </YStack>
          </Form>
        </YStack>
      </YStack>
    </ScrollView>
  );
};

export default ChangePassword;
