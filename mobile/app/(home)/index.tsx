import { Link } from "expo-router";
import { SizableText, YStack } from "tamagui";

export default function Home() {
	return (
		<YStack
			gap="$4"
			padding="$4"
			flex={1}
			justifyContent="center"
			alignItems="center"
		>
			<SizableText>
				<Link href={"/login"}>
					<SizableText>Login</SizableText>
				</Link>
			</SizableText>
			<SizableText>
				<Link href={"/register"}>
					<SizableText>Register</SizableText>
				</Link>
			</SizableText>
		</YStack>
	);
}
