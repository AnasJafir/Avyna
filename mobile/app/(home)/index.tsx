import { RefreshControl, SectionList } from "react-native";
import { SizableText, YStack } from "tamagui";
import { useGetAllSymptoms } from "~/hooks/api";

export default function Home() {
	const symptoms = useGetAllSymptoms();
	if (!symptoms.data?.length) {
		return (
			<YStack gap="$4" justifyContent="center" margin={"$2"} flex={1}>
				<SizableText>No symptoms history yet</SizableText>
			</YStack>
		);
	}
	return (
		<YStack gap="$4" flex={1}>
			<SectionList
				refreshControl={
					<RefreshControl
						refreshing={symptoms.isRefetching}
						onRefresh={symptoms.refetch}
					/>
				}
				sections={symptoms?.data ?? []}
				keyExtractor={(item) => item.id}
				renderItem={({ item }) => {
					return (
						<SizableText
							margin={"$2"}
							color={"#141217"}
							fontWeight={"400"}
							size={"$3"}
						>
							{item.symptoms}
						</SizableText>
					);
				}}
				renderSectionHeader={({ section }) => {
					return (
						<YStack
							backgroundColor={"#AF73EA"}
							height={"$6"}
							justifyContent="center"
							padding={"$2"}
						>
							<SizableText color={"#2D2734"} size={"$5"} fontWeight={"700"}>
								{section.title}
							</SizableText>
						</YStack>
					);
				}}
			/>
		</YStack>
	);
}
