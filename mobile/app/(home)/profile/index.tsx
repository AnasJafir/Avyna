import { KeyboardAvoidingView, Platform, RefreshControl } from 'react-native';
import {
  Avatar,
  Form,
  Input,
  Label,
  ScrollView,
  SizableText,
  Spinner,
  View,
  XStack,
  YStack,
} from 'tamagui';
import { useEditProfile, useGetProfile } from '~/hooks/api';
import { EnumProfile, Profile as UserProfile } from '~/types';
import { match } from 'ts-pattern';
import { Button } from '~/components/button';
import { useAuthStore, useEditProfileStore } from '~/store/store';
import { Controller, useForm } from 'react-hook-form';
import { CheckboxWithLabel } from '~/components/checkbox';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQueryClient } from '@tanstack/react-query';
import { HTTPError } from 'ky';
import { Toast } from 'toastify-react-native';
import { AntDesign } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const ProfileCard = ({ title, value }: { title: string; value: string }) => {
  return (
    <XStack>
      <YStack>
        <SizableText fontWeight={'bold'}>{title}</SizableText>
        <SizableText fontWeight={'normal'}>{value}</SizableText>
      </YStack>
      <View></View>
    </XStack>
  );
};

const Profile = () => {
  const profile = useGetProfile();
  console.log('Profile Data:', profile.data);
  const showProfile = useEditProfileStore();
  return (
    <ScrollView
      backgroundColor={'white'}
      refreshControl={
        <RefreshControl refreshing={profile.isRefetching} onRefresh={() => profile.refetch()} />
      }>
      <View
        paddingLeft={16}
        paddingRight={16}
        flexDirection="column"
        gap={'$4'}
        backgroundColor={'white'}
        flex={1}>
        <View>
          {/* <SizableText fontSize={20} fontWeight={'700'}> */}
          {/*   Personal Information */}
          {/* </SizableText> */}
          <View justifyContent="center" alignItems="center" marginTop={'$4'}>
            <YStack gap={'$5'}>
              <Avatar circular size={'$12'}>
                <Avatar.Image src={require('../../../assets/profile.png')} />
                <Avatar.Fallback backgroundColor={'$blue10'} />
              </Avatar>
              <SizableText fontWeight={'700'} textAlign="center" size={'$4'} color={'#141217'}>
                {profile.data?.user.full_name}{' '}
                {!showProfile.showProfile ? (
                  <AntDesign
                    name="edit"
                    size={20}
                    onPress={() => showProfile.setShowProfile(EnumProfile.EditProfile)}
                  />
                ) : null}
              </SizableText>
            </YStack>
          </View>
        </View>
        {match(showProfile.showProfile)
          .with(EnumProfile.EditProfile as 1, () => <EditProfileView />)
          .with(EnumProfile.Profile as 0, () => <ProfileView profile={profile.data?.user} />)
          .exhaustive()}
      </View>
    </ScrollView>
  );
};

export const ProfileView = ({ profile }: { profile: UserProfile['user'] | undefined }) => {
  const router = useRouter();
  return (
    <View gap={'$3'}>
      <YStack gap={'$4'}>
        <ProfileCard title={'Email'} value={profile?.email ?? 'N/A'} />
        <ProfileCard title={'Age'} value={profile?.age?.toString() ?? 'N/A'} />
        <SizableText fontWeight={'700'}>Health Conditions</SizableText>
        <ProfileCard title={'PCOS'} value={profile?.has_pcos ? 'Yes' : 'No'} />
        <ProfileCard title={'Endometriosis'} value={profile?.has_endometriosis ? 'Yes' : 'No'} />
        <SizableText fontWeight={'700'}>Subscription</SizableText>
        <ProfileCard title={'Plan'} value={profile?.subscription_plan ?? 'N/A'} />
      </YStack>
      <View justifyContent="center" gap={'$2'} marginBottom={'$3'}>
        <Button
          title="Change Password"
          onPress={() => router.push('/(home)/profile/change-password')}
        />
      </View>
    </View>
  );
};

const editProfileSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters' }).max(100),
  email: z.string().email(),
  age: z.coerce.number().min(10, { message: 'Age must be at least 10' }).max(150),
  hasPcos: z.boolean().default(false),
  hasEndometriosis: z.boolean().default(false),
  subscriptionPlan: z.string().default('free'),
});

export const EditProfileView = () => {
  const showProfile = useEditProfileStore();
  const auth = useAuthStore();
  const form = useForm({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: auth.user?.user.full_name ?? '',
      email: auth.user?.user.email ?? '',
      age: auth.user?.user.age ?? 0,
      hasPcos: auth.user?.user.has_pcos ?? false,
      hasEndometriosis: auth.user?.user.has_endometriosis ?? false,
      subscriptionPlan: auth.user?.user.subscription_plan ?? 'free',
    },
  });

  const edit = useEditProfile();
  const queryClient = useQueryClient();
  const onSubmit = form.handleSubmit((data) => {
    console.log('Form-Data: ', data);
    edit.mutate(
      {
        ...data,
        full_name: data.fullName,
        has_pcos: data.hasPcos,
        has_endometriosis: data.hasEndometriosis,
        subscription_plan: data.subscriptionPlan,
      },
      {
        onSuccess: () => {
          showProfile.setShowProfile(EnumProfile.Profile);
          queryClient.invalidateQueries({
            queryKey: ['profile', auth.user?.token],
          });
        },
        onError: async (error) => {
          console.log('EEE', error);
          if (error instanceof HTTPError) {
            const response = await error.response.json<{ error: string }>();
            Toast.error(response.error);
          }
        },
      }
    );
  });
  return (
    <View>
      <YStack backgroundColor={'white'} flex={1}>
        <Form flex={1} onSubmit={onSubmit}>
          <YStack gap={10} backgroundColor={'white'} padding={'$1'}>
            <YStack backgroundColor={'white'}>
              <Label htmlFor="fullName">Full Name</Label>
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
                      placeholder="Enter your full name"
                      height={50}
                      flex={1}
                      borderStyle="unset"
                      placeholderTextColor={'#734F94'}
                    />
                  );
                }}
              />
            </YStack>
            {form.formState.errors.fullName ? (
              <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                {form.formState.errors.fullName.message}
              </SizableText>
            ) : null}
            <YStack backgroundColor={'white'}>
              <Label htmlFor="email">Email</Label>
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
                      placeholder="Enter your email"
                      height={50}
                      flex={1}
                      borderStyle="unset"
                      placeholderTextColor={'#734F94'}
                    />
                  );
                }}
              />
            </YStack>
            {form.formState.errors.email ? (
              <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                {form.formState.errors.email.message}
              </SizableText>
            ) : null}
            <YStack>
              <Label htmlFor="age">Age</Label>
              <Controller
                control={form.control}
                name="age"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <View position="relative" flexDirection="row" flex={1}>
                      <Input
                        borderWidth={0}
                        value={value as any}
                        backgroundColor={'#EDE8F2'}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        placeholder="Enter your age"
                        height={50}
                        defaultValue={value.toString()}
                        flex={1}
                        borderStyle="unset"
                        placeholderTextColor={'#734F94'}
                      />
                    </View>
                  );
                }}
              />
            </YStack>
            {form.formState.errors.age ? (
              <SizableText size={'$1'} backgroundColor={'white'} color={'red'}>
                {form.formState.errors.age.message}
              </SizableText>
            ) : null}
            <YStack>
              <Label>Health Conditions</Label>
              <Controller
                control={form.control}
                name="hasPcos"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="one"
                      labelSize={'$2'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      defaultChecked={value}
                      label="Do you have PCOS?"
                    />
                  );
                }}
              />
            </YStack>
            <XStack>
              <Controller
                control={form.control}
                name="hasEndometriosis"
                render={({ field: { value, onBlur, onChange } }) => {
                  return (
                    <CheckboxWithLabel
                      id="two"
                      labelSize={'$2'}
                      onBlur={onBlur}
                      onCheckedChange={onChange}
                      value={value as any}
                      defaultChecked={value}
                      label="Do you have Endometriosis?"
                    />
                  );
                }}
              />
            </XStack>
            <YStack>
              <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <Form.Trigger disabled={edit.isPending} asChild>
                  <Button
                    icon={edit.isPending ? <Spinner size="small" color={'white'} /> : null}
                    title="Save"
                  />
                </Form.Trigger>
              </KeyboardAvoidingView>
            </YStack>
            <View backgroundColor={'red'} style={{ flex: 1 }} />
          </YStack>
        </Form>
      </YStack>
    </View>
  );
};
export default Profile;
