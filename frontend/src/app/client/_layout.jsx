import { ActivityIndicator, Text, View } from "react-native";
import { Redirect, Stack } from "expo-router";

import { useAuth } from "../../context/AuthContext";

export default function ClientLayout() {
  const { user, userData, authLoading } = useAuth();

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Checking session...</Text>
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/login" />;
  }

  if (!userData?.onboarded) {
    return <Redirect href="/onboarding" />;
  }

  if (userData?.role !== "client") {
    return <Redirect href="/barber/dashboard" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="editProfile" />
      <Stack.Screen name="styles" />
      <Stack.Screen name="barber/[barberId]" />

    </Stack>
  );
}