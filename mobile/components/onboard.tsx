import React from "react";
import { Image, SizableText, View, YStack } from "tamagui";
import { useOnboardStore } from "~/store/store";

const OnBoardScreen = () => {
	const onBoard = useOnboardStore();
	React.useLayoutEffect(() => {
		const timout = setTimeout(() => {
			onBoard.setHasSeen({ step: 2, seen: false });
		}, 5000);
		return () => clearTimeout(timout);
	}, [onBoard]);
	return (
		<View backgroundColor={"#9942F0"} flex={1}>
			<YStack>
				<View>
					<Image source={require("../assets/logo.png")} />
				</View>
				<View>
					<SizableText color={"white"} fontSize={"$8"} textAlign="center">
						Feel Better. Every {"\n"} cycle, every day.
					</SizableText>
				</View>
			</YStack>
		</View>
	);
};

export default OnBoardScreen;
