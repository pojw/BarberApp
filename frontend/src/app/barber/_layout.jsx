
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { Tabs, useRouter } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { Stack } from "expo-router";
import { auth, db } from "../../config/firebase";

export default function BarberLayout() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        if (!user) {
          router.replace("/login");
          return;
        }

        const userRef = doc(db, "users", user.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          router.replace("/login");
          return;
        }

        const userData = userSnap.data();

        if (!userData.onboarded) {
          router.replace("/onboarding");
          return;
        }

        if (userData.role !== "barber") {
          router.replace("/client/home");
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.log("Barber protected route error:", error);
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  if (checkingAuth) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
      </View>
    );
  }

    return (
        <Stack screenOptions={{headerShown:false}}>
            <Stack.Screen name="(tabs)"></Stack.Screen>
            <Stack.Screen name="editProfile"></Stack.Screen>
            <Stack.Screen name="services"></Stack.Screen>
            <Stack.Screen name="settings"></Stack.Screen>
        </Stack>
    );
    }