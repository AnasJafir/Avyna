import { Stack } from "expo-router";

const OnBoardLayout = () => {
	return (
		<Stack screenOptions={{ headerShown: false }}>
			<Stack.Screen name="index" />
		</Stack>
	);
};

export default OnBoardLayout;
