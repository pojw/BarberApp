import CenterScreen from "../../../components/centerScreen";
import { useRouter } from "expo-router";
import { View, Text, Pressable } from "react-native";

export default function HairProfileIndex() {
  const router = useRouter();

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <Text className="text-3xl font-bold text-gray-900">
            Hair Profile
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-600">
            Build a simple hair profile so BarberApp can give better haircut
            recommendations based on your current hair, style goals, and notes.
          </Text>

          <View className="mt-6 rounded-2xl bg-green-50 p-4">
            <Text className="text-base font-semibold text-green-700">
              What this helps with
            </Text>

            <Text className="mt-2 text-sm leading-5 text-gray-700">
              • Better haircut recommendations{"\n"}
              • Easier conversations with barbers{"\n"}
              • A saved profile you can update later{"\n"}
              • More confidence before your next booking
            </Text>
          </View>

          <View className="mt-6 rounded-2xl bg-gray-50 p-4">
            <Text className="text-base font-semibold text-gray-900">
              How it works
            </Text>

            <Text className="mt-2 text-sm leading-5 text-gray-600">
              You’ll choose which photo angles you want to provide. For now,
              this is a basic mock version while the full image upload system is
              being built.
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/client/hairProfile/uploadProfile")}
            className="mt-6 rounded-2xl bg-green-500 px-5 py-4"
          >
            <Text className="text-center text-base font-bold bg-black text-white">
              Start Hair Analysis
            </Text>
          </Pressable>
        </View>
      </View>
    </CenterScreen>
  );
}