import { Avatar, SizableText, View, XStack, YStack } from 'tamagui';

const ProfileData = {
  fullName: 'Olivia Benneth',
  image: '',
  email: 'olivia Benneth',
  age: 28,
  PCOS: 'None',
  plan: 'free',
};

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
  const profile = ProfileData;
  return (
    <View
      paddingLeft={16}
      paddingRight={16}
      flexDirection="column"
      gap={'$4'}
      backgroundColor={'white'}
      flex={1}>
      <View>
        <SizableText fontSize={20} fontWeight={'700'}>
          Personal Information
        </SizableText>
        <View justifyContent="center" alignItems="center" marginTop={'$4'}>
          <YStack gap={'$5'}>
            <Avatar circular size={'$12'}>
              <Avatar.Image src={require('../../assets/profile.png')} />
              <Avatar.Fallback backgroundColor={'$blue10'} />
            </Avatar>
            <SizableText fontWeight={'700'} textAlign="center" size={'$4'} color={'#141217'}>
              {profile.fullName}
            </SizableText>
          </YStack>
        </View>
      </View>
      <View>
        <YStack gap={'$4'}>
          <ProfileCard title={'Email'} value={profile.email} />
          <ProfileCard title={'Age'} value={profile.age.toString()} />
          <SizableText fontWeight={'700'}>Health Conditions</SizableText>
          <ProfileCard title={'PCOS'} value={profile.PCOS} />
          <SizableText fontWeight={'700'}>Subscription</SizableText>
          <ProfileCard title={'Plan'} value={profile.plan} />
        </YStack>
      </View>
    </View>
  );
};

export default Profile;
