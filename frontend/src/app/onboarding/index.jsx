import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

export default function OnboardingChoice() {
  const router = useRouter();

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-10 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-3xl bg-black">
            <Text className="text-3xl font-bold text-white">B</Text>
          </View>

          <Text className="text-center text-3xl font-bold text-black">
            How are you using BarberApp?
          </Text>

          <Text className="mt-3 text-center text-base text-gray-500">
            Choose your account type so we can set up the right experience.
          </Text>
        </View>

        <Pressable
          onPress={() => router.push("/onboarding/client")}
          className="mb-4 rounded-2xl bg-black px-4 py-5 active:opacity-80"
        >
          <Text className="text-center text-lg font-bold text-white">
            I’m a Client
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-300">
            Find barbers and book appointments.
          </Text>
        </Pressable>

        <Pressable
          onPress={() => router.push("/onboarding/barber")}
          className="rounded-2xl border border-gray-300 bg-white px-4 py-5 active:opacity-80"
        >
          <Text className="text-center text-lg font-bold text-black">
            I’m a Barber
          </Text>
          <Text className="mt-1 text-center text-sm text-gray-500">
            Manage your profile, services, and bookings.
          </Text>
        </Pressable>
      </View>
    </CenterScreen>
  );
}