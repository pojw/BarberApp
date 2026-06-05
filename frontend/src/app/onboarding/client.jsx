import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

import { auth, db } from "../../config/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function ClientOnboarding() {
  const router = useRouter();

  const [preferredName, setPreferredName] = useState("");
  const [city, setCity] = useState("");
const [state, setState] = useState("");
  async function handleFinish() {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No logged-in user found.");
      return;
    }

    if (!preferredName || !city|| !state){
      Alert.alert("Missing information", "Please fill out all fields.");
      return;
    }

    try {
      await setDoc(doc(db, "clients", user.uid), {
        userId: user.uid,
        preferredName: preferredName.trim(),
  location: {
    city: city.trim(),
    state: state.trim(),
  },        favoriteBarbers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        role: "client",
        onboarded: true,
        updatedAt: serverTimestamp(),
      });

      router.replace("/home");
    } catch (error) {
      console.log(error);
      Alert.alert("Client setup failed", error.message);
    }
  }

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black">
            Client Setup
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            Basic client onboarding placeholder. We’ll add more details later.
          </Text>
        </View>

        <View className="rounded-3xl border border-gray-200 bg-white p-5">
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Preferred name
            </Text>
            <TextInput
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="Jaylin"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>
<View className="mb-6">
  <Text className="mb-2 text-sm font-semibold text-gray-700">
    State
  </Text>
  <TextInput
    value={state}
    onChangeText={setState}
    placeholder="IN"
    placeholderTextColor="#9CA3AF"
    autoCapitalize="characters"
    maxLength={2}
    className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
  />
</View>
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Indianapolis"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <Pressable
            onPress={handleFinish}
            className="rounded-2xl bg-black px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-white">
              Finish Client Setup
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