import { Link } from "expo-router";
import { ImageBackground } from "react-native";
import { SizableText, View, XStack, YStack } from "tamagui";
import { useOnboardStore } from "~/store/store";

const WelcomeScreen = () => {
	const onBoard = useOnboardStore();
	return (
		<ImageBackground
			source={require("../assets/welcome.png")}
			resizeMode="cover"
			style={{
				flex: 1,
				justifyContent: "center",
				alignItems: "center",
				backgroundColor: "#AD73EB",
				opacity: 0.95,
			}}
		>
			<View flex={1} width={"100%"}>
				<YStack
					marginTop={250}
					flex={1}
					justifyContent="space-evenly"
					alignItems="center"
				>
					<SizableText
						color={"white"}
						textAlign="center"
						size={"$4"}
						//@ts-ignore execption for roboto
						fontFamily={"Roboto"}
						fontWeight={"700"}
						lineHeight={30}
					>
						Avyna helps you track your {"\n"} symptoms, receive AI-powered{" "}
						{"\n"} wellness advice, and take {"\n"} control of your hormonal
						health.
					</SizableText>
					<YStack alignItems="center">
						<Link
							asChild
							push
							href={"/(session)/login"}
							onPress={() => onBoard.setHasSeen({ step: 2, seen: true })}
						>
							<SizableText
								size="$4"
								color={"#350F57"} //@ts-ignore execption for roboto
								fontFamily={"AbeeZee"}
							>
								Sing In
							</SizableText>
						</Link>
						<XStack alignItems="center" gap="$1">
							<SizableText color={"#350F57"}>Don’t have an account</SizableText>
							<Link
								href="/register"
								onPress={() => onBoard.setHasSeen({ step: 2, seen: true })}
							>
								<SizableText
									color={"#350F57"}
									size="$4" //@ts-ignore execption for roboto
									fontFamily={"AbeeZee"}
								>
									Sing up
								</SizableText>
							</Link>
						</XStack>
					</YStack>
				</YStack>
			</View>
		</ImageBackground>
	);
};

export default WelcomeScreen;
