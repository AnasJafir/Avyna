import { ReactNode } from 'react';
import Markdown, { MarkdownIt } from '@ronradtke/react-native-markdown-display';
import { ScrollView, SizableText, View, XStack, YStack } from 'tamagui';

export const AIRecommend = ({
  headerText,
  icon,
  title,
  content,
}: {
  headerText: string;
  icon?: ReactNode;
  title: string | undefined;
  content: string | undefined;
}) => {
  return (
    <YStack flex={1}>
      <YStack backgroundColor={'#AF73EA'} height={'$6'} justifyContent="center" padding={'$2'}>
        <SizableText color={'#2D2734'} size={'$6'} fontWeight={'700'}>
          {headerText}
        </SizableText>
      </YStack>
      <XStack margin={'$3'} gap={'$3'}>
        <View
          backgroundColor={'#F2F0F5'}
          width={'$6'}
          height={'$6'}
          alignItems="center"
          borderRadius={'$4'}
          justifyContent="center">
          {icon}
        </View>
        <YStack flex={1}>
          <SizableText size={'$5'} fontWeight={'700'} color={'#141217'}>
            {title}
          </SizableText>
          <ScrollView contentInsetAdjustmentBehavior="automatic" marginTop={'$2'}>
            <Markdown
              style={{
                body: {
                  display: 'flex',
                  color: '#75618A',
                  fontSize: 15,
                  textAlign: 'auto',
                  fontFamily: 'ManropeRegular',
                },
              }}>
              {content!}
            </Markdown>
          </ScrollView>
        </YStack>
      </XStack>
    </YStack>
  );
};
