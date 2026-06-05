import { View, Text, TextInput, Pressable } from "react-native";
import { useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

export default function BarberOnboarding() {
  const router = useRouter();

  function handleFinish() {
    // Later: save barber onboarding info to Firebase
    router.replace("/home");
  }

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black">
            Barber Setup
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            Basic barber onboarding placeholder. We’ll add services, portfolio,
            hours, and location later.
          </Text>
        </View>

        <View className="rounded-3xl border border-gray-200 bg-white p-5">
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Barber name
            </Text>
            <TextInput
              placeholder="Your barber name"
              placeholderTextColor="#9CA3AF"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Shop or business name
            </Text>
            <TextInput
              placeholder="Optional"
              placeholderTextColor="#9CA3AF"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              City
            </Text>
            <TextInput
              placeholder="Indianapolis"
              placeholderTextColor="#9CA3AF"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <Pressable
            onPress={handleFinish}
            className="rounded-2xl bg-black px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-white">
              Finish Barber Setup
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-black">
              Back
            </Text>
          </Pressable>
        </View>
      </View>
    </CenterScreen>
  );
}