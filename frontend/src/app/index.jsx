import { ActivityIndicator, Text, View } from "react-native";
import { Redirect } from "expo-router";

import { useAuth } from "../context/AuthContext";

export default function Index() {
  const { user, userData, authLoading } = useAuth();

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-base text-gray-500">
          Restoring your session...
        </Text>
      </View>
    );
  }

  // Only go to login after Firebase confirms no user exists.
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Firebase user exists, but the Firestore user document is missing.
  if (!userData) {
    return (
      <View className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-xl font-bold text-black">
          Account data could not be found.
        </Text>

        <Text className="mt-2 text-center text-gray-500">
          Your login exists, but your profile document is missing.
        </Text>
      </View>
    );
  }

  if (!userData.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (userData.role === "client") {
    return <Redirect href="/client/home" />;
  }

  if (userData.role === "barber") {
    return <Redirect href="/barber/dashboard" />;
  }

  return (
    <View className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-xl font-bold text-black">
        Invalid account role
      </Text>
    </View>
  );
}