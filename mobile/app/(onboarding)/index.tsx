import { SizableText, View } from "tamagui";
import { match } from "ts-pattern";
import OnBoardScreen from "~/components/onboard";
import WelcomeScreen from "~/components/welcome";
import { useOnboardStore } from "~/store/store";

const OnBoardingScreen = () => {
	const onboard = useOnboardStore();
	return match(onboard.hasSeen.step)
		.with(1, () => <OnBoardScreen />)
		.with(2, () => <WelcomeScreen />)
		.otherwise(() => (
			<View>
				<SizableText>No onboarding</SizableText>
			</View>
		));
};
export default OnBoardingScreen;
