import { View, Text, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { auth } from "../../config/firebase";

export default function BarberProfile() {
  const router = useRouter();

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
      Alert.alert("Logout failed", "Something went wrong while logging out.");
    }
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="mb-6 text-2xl font-bold">Barber Profile</Text>

      <Pressable
        onPress={handleLogout}
        className="w-full rounded-xl bg-red-500 py-4"
      >
        <Text className="text-center font-semibold text-white">Logout</Text>
      </Pressable>
    </View>
  );
}