import { Check as CheckIcon } from "@tamagui/lucide-icons";
import { Checkbox, type CheckboxProps, Label, XStack } from "tamagui";

export const CheckboxWithLabel = ({
	size,
	labelSize,
	label = "Accept terms and conditions",
	...checkboxProps
}: CheckboxProps & { label?: string; labelSize?: string }) => {
	const id = `checkbox-${(size || "").toString().slice(1)}`;
	return (
		<XStack width={300} alignItems="center" gap="$4">
			<Checkbox id={id} size={size} {...checkboxProps}>
				<Checkbox.Indicator>
					<CheckIcon />
				</Checkbox.Indicator>
			</Checkbox>

			<Label size={labelSize} htmlFor={id}>
				{label}
			</Label>
		</XStack>
	);
};
