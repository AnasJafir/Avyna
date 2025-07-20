import { type ComponentProps, forwardRef } from "react";
import type { TamaguiElement } from "tamagui";
import { Button as TButton } from "../tamagui.config";

type ButtonProps = {
	title: string;
} & ComponentProps<typeof TButton>;

export const CButton = forwardRef<TamaguiElement, ButtonProps>(
	({ title, ...tButtonProps }, ref) => {
		return (
			<TButton
				{...tButtonProps}
				ref={ref}
				backgroundColor={"#AD73EB"}
				color={"white"}
				borderRadius={"$10"}
			>
				{title}
			</TButton>
		);
	},
);
CButton.displayName = "Button";
