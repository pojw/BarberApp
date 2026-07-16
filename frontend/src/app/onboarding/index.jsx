import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-8 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-app-primary">
            <Text className="text-3xl font-bold text-app-text-inverse">C</Text>
          </View>

          <Text
            style={{ fontSize: 38 }}
            className="text-center font-bold text-app-text"
          >
            Cut<Text className="text-app-primary">Care</Text>
          </Text>

          <Text className="mt-6 text-center text-3xl font-bold text-app-text">
            How are you using CutCare?
          </Text>

        </View>

        <Pressable
          onPress={() => router.push("/onboarding/client")}
          className="mb-4 rounded-2xl border border-app-border bg-app-surface px-4 py-5 active:bg-app-primary"
        >
          <Text className="text-center text-lg font-bold text-app-text active:text-app-text-inverse">
            I’m a Client
          </Text>
          <Text className="mt-1 text-center text-sm text-app-text-secondary active:text-app-text-inverse">
            Find barbers, book appointments, and chat with AI Assistant.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/onboarding/barber")}
          className="rounded-2xl border border-app-border bg-app-surface px-4 py-5 active:bg-app-primary"
        >
          <Text className="text-center text-lg font-bold text-app-text active:text-app-text-inverse">
            I’m a Barber
          </Text>
          <Text className="mt-1 text-center text-sm text-app-text-secondary active:text-app-text-inverse">
            Manage your profile, services, and bookings.
          </Text>
        </Pressable>
      </View>
    </CenterScreen>
  );
}
