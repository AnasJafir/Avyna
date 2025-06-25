import { ComponentProps, forwardRef } from 'react';
import { TamaguiElement } from 'tamagui';
import { Button as TButton } from '../tamagui.config';

type ButtonProps = {
  title: string;
} & ComponentProps<typeof TButton>;

export const Button = forwardRef<TamaguiElement, ButtonProps>(({ title, ...tButtonProps }, ref) => {
  return (
    <TButton
      {...tButtonProps}
      ref={ref}
      backgroundColor={'#AD73EB'}
      color={'white'}
      borderRadius={'$10'}>
      {title}
    </TButton>
  );
});
Button.displayName = 'Button';
