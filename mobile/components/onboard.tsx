import { View, YStack, Image, SizableText } from 'tamagui';

const OnBoardScreen = () => {
  return (
    <View backgroundColor={'#9942F0'} flex={1}>
      <YStack>
        <View>
          <Image source={require('../assets/logo.png')} />
        </View>
        <View>
          <SizableText color={'white'} fontSize={'$8'} textAlign="center">
            Feel Better. Every {'\n'} cycle, every day.
          </SizableText>
        </View>
      </YStack>
    </View>
  );
};

export default OnBoardScreen;
