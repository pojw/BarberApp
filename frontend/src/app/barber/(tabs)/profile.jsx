import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";

function InfoRow({ label, value, compact = false }) {
  return (
    <View className={compact ? "" : "mb-5"}>
      <Text className="mb-1 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <Text className="text-base font-semibold text-app-text">
        {value === undefined || value === null || value === ""
          ? "Not added yet"
          : String(value)}
      </Text>
    </View>
  );
}

function InfoPair({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <View className="mb-5 flex-row gap-4">
      <View className="flex-1">
        <InfoRow label={leftLabel} value={leftValue} compact />
      </View>

      <View className="flex-1">
        <InfoRow label={rightLabel} value={rightValue} compact />
      </View>
    </View>
  );
}

function RatingStars({ rating, reviewCount }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <View className="mt-2 flex-row items-center">
      {Array.from({ length: 5 }, (_, index) => (
        <Ionicons
          key={index}
          name={index < roundedRating ? "star" : "star-outline"}
          size={16}
          color="#1677FF"
        />
      ))}

      <Text className="ml-2 text-sm font-semibold text-app-text-muted">
        ({reviewCount || 0})
      </Text>
    </View>
  );
}

export default function BarberProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [barberData, setBarberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const barberRef = doc(db, "barbers", currentUser.uid);

        const [userSnap, barberSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(barberRef),
        ]);

        if (!userSnap.exists()) {
          setErrorMessage("User account data could not be found.");
          return;
        }

        if (!barberSnap.exists()) {
          setErrorMessage("Barber profile data could not be found.");
          return;
        }

        setUserData(userSnap.data());
        setBarberData(barberSnap.data());
      } catch (error) {
        console.log("Barber profile load error:", error);
        setErrorMessage("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Profile Error
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage}
        </Text>

        <Pressable
          onPress={handleLogout}
          className="mt-8 rounded-2xl bg-app-primary px-6 py-4 active:bg-app-primary-pressed"
        >
          <Text className="font-bold text-app-text-inverse">Log Out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const profileName =
    barberData?.businessName ||
    userData?.fullName ||
    "Barber";
  const city = barberData?.location?.city;
  const state = barberData?.location?.state;
  const locationText =
    city && state
      ? `${city}, ${state}`
      : city || state || "Location not added";
  const profileImageUrl =
    barberData?.profileImageUrl ||
    userData?.profileImageUrl ||
    "";
  const profileInitial = profileName.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 flex-row items-start justify-between">
          <Text className="text-3xl font-bold text-app-text">
            Barber<Text className="text-app-primary">Profile</Text>
          </Text>

          <Pressable
            onPress={() => router.push("/barber/settings")}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#1677FF"
            />
          </Pressable>
        </View>

        <View className="mb-8 items-center self-center" style={{ width: "88%" }}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={{ width: 108, height: 108, borderRadius: 54 }}
              className="bg-app-surface-elevated"
            />
          ) : (
            <View
              style={{ width: 108, height: 108, borderRadius: 54 }}
              className="items-center justify-center bg-app-primary-soft"
            >
              <Text className="text-5xl font-bold text-app-primary">
                {profileInitial}
              </Text>
            </View>
          )}

          <Text className="mt-4 text-center text-2xl font-bold text-app-text">
            {profileName}
          </Text>

          <RatingStars
            rating={barberData?.rating}
            reviewCount={barberData?.reviewCount}
          />
        </View>

        <View className="mb-6 self-center" style={{ width: "88%" }}>
          <InfoPair
            leftLabel="Full Name"
            leftValue={userData?.fullName}
            rightLabel="Phone"
            rightValue={barberData?.phone}
          />

          <InfoPair
            leftLabel="Location"
            leftValue={locationText}
            rightLabel="Accepted Payments"
            rightValue="Routing needed"
          />

          <InfoRow label="Bio" value={barberData?.bio} />
        </View>

        <Pressable
          onPress={() => router.push("/barber/editProfile")}
          className="mb-4 self-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
          style={{ width: "88%" }}
        >
          <Text className="text-center text-base font-bold text-app-text">
            Edit Profile
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="mb-10 self-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
          style={{ width: "88%" }}
        >
          <Text className="text-center text-base font-bold text-app-text-muted">
            Log Out
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
