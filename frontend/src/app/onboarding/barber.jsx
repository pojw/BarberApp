import { useState } from "react";
import { View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import CenterScreen from "../../components/centerScreen";

import { auth, db } from "../../config/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

export default function BarberOnboarding() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [bio, setBio] = useState("");

  async function handleFinish() {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No logged-in user found.");
      return;
    }

    if (!businessName || !phone || !city || !state) {
      Alert.alert("Missing information", "Please fill out the required fields.");
      return;
    }

    try {
      await setDoc(doc(db, "barbers", user.uid), {
        userId: user.uid,
        businessName: businessName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: {
          city: city.trim(),
          state: state.trim(),
        },
        services: [],
        specialties: [],
        portfolioImages: [],
        availability: {},
        googleCalendarConnected: false,
        rating: 0,
        reviewCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        role: "barber",
        onboarded: true,
        updatedAt: serverTimestamp(),
      });

      router.replace("/barber/dashboard");
    } catch (error) {
      console.log(error);
      Alert.alert("Barber setup failed", error.message);
    }
  }

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black">
            Barber Setup
          </Text>
          <Text className="mt-2 text-base text-gray-500">
            Add your basic barber or business information.
          </Text>
        </View>

        <View className="rounded-3xl border border-gray-200 bg-white p-5">
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Business name
            </Text>
            <TextInput
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Jaylin Cuts"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Phone number
            </Text>
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="765-123-4567"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-4">
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

          <View className="mb-4">
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
              Bio
            </Text>
            <TextInput
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about your services..."
              placeholderTextColor="#9CA3AF"
              multiline
              textAlignVertical="top"
              className="min-h-24 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
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