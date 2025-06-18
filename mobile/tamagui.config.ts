import { createAnimations } from '@tamagui/animations-react-native';
import { createMedia } from '@tamagui/react-native-media-driver';
import { shorthands } from '@tamagui/shorthands';
import { themes, tokens } from '@tamagui/themes';
import {
  createTamagui,
  createFont,
  isWeb,
  styled,
  SizableText,
  H1,
  YStack,
  Button as ButtonTamagui,
} from 'tamagui';

const manRope = createFont({
  family: isWeb ? 'Helvetica, Arial, sans-serif' : 'ManropeRegular',
  size: {
    1: 12,
    2: 14,
    3: 16,
    4: 18,
    5: 20,
    6: 24,
    7: 30,
    8: 36,
    9: 48,
    10: 60,
    11: 72,
    12: 96,
    13: 128,
  },
  lineHeight: {
    2: 22,
  },
  weight: {
    1: '100',
    2: '200',
    3: '300',
    4: '400',
    5: '500',
    6: '600',
    7: '700',
    8: '800',
    9: '900',
  },
  letterSpacing: {
    1: 0,
    2: -1,
    // 3 will be -1
  },
  // (native only) swaps out fonts by face/style
  face: {
    200: { normal: 'Manrope' },
    300: { normal: 'ManropeLight' },
    400: { normal: 'ManropeRegular' },
    500: { normal: 'ManropeMedium' },
    600: { normal: 'ManropeSemiBold' },
    700: { normal: 'ManropeExtraBold' },
  },
});
const animations = createAnimations({
  bouncy: {
    damping: 10,
    mass: 0.9,
    stiffness: 100,
    type: 'spring',
  },
  lazy: {
    damping: 20,
    type: 'spring',
    stiffness: 60,
  },
  quick: {
    damping: 20,
    mass: 1.2,
    stiffness: 250,
    type: 'spring',
  },
});

export const Container = styled(YStack, {
  flex: 1,
  padding: 24,
});

export const Main = styled(YStack, {
  flex: 1,
  justifyContent: 'space-between',
  maxWidth: 960,
});

export const Title = styled(H1, {
  color: '#000',
  size: '$9',
});

export const Subtitle = styled(SizableText, {
  color: '#38434D',
  size: '$7',
});

export const Button = styled(ButtonTamagui, {
  backgroundColor: '#9942F0',
  borderRadius: 28,
  hoverStyle: {
    backgroundColor: '#5a5fcf',
  },
  pressStyle: {
    backgroundColor: '#5a5fcf',
  },
  maxWidth: 500,

  shadowColor: '#000',
  shadowOffset: {
    height: 2,
    width: 0,
  },
  shadowOpacity: 0.25,
  shadowRadius: 3.84,

  // Button text
  color: '#FFFFFF',
  fontWeight: '600', // Is not passed down to the text. Probably a bug in Tamagui: https://github.com/tamagui/tamagui/issues/1156#issuecomment-1802594930
  fontSize: '$3',
});

const myConfig = createTamagui({
  light: {
    color: {
      background: '#fff',
      text: 'black',
    },
  },
  defaultFont: 'body',
  animations,
  shouldAddPrefersColorThemes: true,
  themeClassNameOnRoot: true,
  shorthands,
  fonts: {
    body: manRope,
    heading: manRope,
  },
  themes,
  tokens,
  media: createMedia({
    xs: { maxWidth: 660 },
    sm: { maxWidth: 800 },
    md: { maxWidth: 1020 },
    lg: { maxWidth: 1280 },
    xl: { maxWidth: 1420 },
    xxl: { maxWidth: 1600 },
    gtXs: { minWidth: 660 + 1 },
    gtSm: { minWidth: 800 + 1 },
    gtMd: { minWidth: 1020 + 1 },
    gtLg: { minWidth: 1280 + 1 },
    short: { maxHeight: 820 },
    tall: { minHeight: 820 },
    hoverNone: { hover: 'none' },
    pointerCoarse: { pointer: 'coarse' },
  }),
});

type AppConfig = typeof myConfig;

// Enable auto-completion of props shorthand (ex: jc="center") for Tamagui templates.
// Docs: https://tamagui.dev/docs/core/configuration

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default myConfig;
