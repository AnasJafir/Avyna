import { ReactNode } from 'react';
import Markdown, { MarkdownIt } from '@ronradtke/react-native-markdown-display';
import { SizableText, View, XStack, YStack } from 'tamagui';

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
        <YStack>
          <SizableText size={'$5'} fontWeight={'700'} color={'#141217'}>
            {title}
          </SizableText>
          <Markdown
            markdownit={MarkdownIt({ typographer: true }).disable(['image'])}
            style={{
              body: {
                textOverflow: 'ellipsis',
                overflow: 'hidden',
                width: '91%',
                display: 'flex',
                color: '#75618A',
                fontSize: 14,
                textAlign: 'auto',
                justifyContent: 'center',
                alignItems: 'center',
                fontFamily: 'Space',
              },
            }}>
            {content!}
          </Markdown>
        </YStack>
      </XStack>
    </YStack>
  );
};
