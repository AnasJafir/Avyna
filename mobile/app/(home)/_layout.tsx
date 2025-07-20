import { AntDesign, Foundation, Ionicons, Octicons } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import { useAuthStore } from "~/store/store";
export default function Home() {
	const user = useAuthStore();
	if (!user.user) {
		return <Redirect href={"/login"} />;
	}
	return (
		<Tabs
			screenOptions={{
				tabBarStyle: {
					height: 70,
				},
				tabBarLabelStyle: {
					color: "#AF73EA",
					fontFamily: "ManropeBold",
					fontSize: 12,
					textAlign: "center",
				},
				animation: "fade",
			}}
		>
			<Tabs.Screen
				name="index"
				options={{
					tabBarIcon: ({ focused }) =>
						focused ? (
							<Foundation name="home" size={30} color="#AF73EA" />
						) : (
							<Octicons name={"home"} size={30} color={"#AF73EA"} style={{}} />
						),
					headerTitle: "Home",
					tabBarLabel: "Home",
				}}
			/>
			<Tabs.Screen
				name="track"
				options={{
					tabBarIcon: ({ focused }) => (
						<AntDesign
							name={focused ? "plussquare" : "plussquareo"}
							size={30}
							color={"#AF73EA"}
						/>
					),
					headerTitleAlign: "center",
					headerShadowVisible: false,
					headerShown: false,
					headerTitle: "Track Symptoms",
					tabBarLabel: "Track",
				}}
			/>
			<Tabs.Screen
				name="learn"
				options={{
					tabBarIcon: ({ focused }) =>
						focused ? (
							<Ionicons name={"book"} size={30} color={"#AF73EA"} />
						) : (
							<Octicons name="book" size={30} color={"#AF73EA"} />
						),
					headerTitle: "Learn",
					tabBarLabel: "Learn",
				}}
			/>
			<Tabs.Screen
				name="community"
				options={{
					tabBarIcon: ({ focused }) =>
						focused ? (
							<Ionicons name={"people"} size={30} color={"#AF73EA"} />
						) : (
							<Octicons name="people" size={30} color={"#AF73EA"} />
						),
					headerTitle: "Community",
					tabBarLabel: "Community",
				}}
			/>
			<Tabs.Screen
				name="profile"
				options={{
					tabBarIcon: ({ focused }) => (
						<Octicons
							name={focused ? "person-fill" : "person"}
							size={30}
							color={"#AF73EA"}
						/>
					),
					headerTitleAlign: "center",
					headerShadowVisible: false,
					headerTitle: "Profile",
					tabBarLabel: "Profile",
					headerShown: false,
				}}
			/>
		</Tabs>
	);
}
