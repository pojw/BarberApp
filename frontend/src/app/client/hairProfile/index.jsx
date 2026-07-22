import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../../config/firebase";
import { getActiveHairProfile } from "../../../services/hairProfileService";

function HairProfileHeader({ onBack }) {
  return (
    <View className="mb-6 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Hair<Text className="text-app-primary">Profile</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function HairProfileIndex() {
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadActiveProfile();
  }, []);

  async function loadActiveProfile() {
    try {
      setLoading(true);
      setErrorMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMessage("You must be logged in.");
        return;
      }

      const result = await getActiveHairProfile(currentUser.uid);

      setProfile(result);
    } catch (error) {
      console.log("Error loading active hair profile:", error);
      setErrorMessage("Could not load your hair profile.");
    } finally {
      setLoading(false);
    }
  }
  if (loading) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
      <ActivityIndicator />
      <Text className="mt-3 text-app-text-muted">
        Loading hair profile...
      </Text>
    </SafeAreaView>
  );
}
if (errorMessage) {
  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-1 px-6 py-6">
        <HairProfileHeader onBack={() => router.back()} />

        <Text className="mt-3 text-app-text-muted">
          {errorMessage}
        </Text>

        <Pressable
          onPress={loadActiveProfile}
          className="mt-6 rounded-2xl bg-app-primary px-5 py-4 active:bg-app-primary-pressed"
        >
          <Text className="text-center font-semibold text-app-text-inverse">
            Try Again
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
if (!profile) {
  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-1 px-6 py-6">
        <HairProfileHeader onBack={() => router.back()} />

        <View className="rounded-3xl bg-app-surface p-6">
          <Text className="text-base leading-6 text-app-text-secondary">
            Analyze your current hair so BarberApp can give better haircut
            recommendations based on your current hair and style goals.
          </Text>

          <Pressable
            onPress={() =>
              router.push("/client/hairProfile/uploadProfile")
            }
            className="mt-6 rounded-2xl bg-app-primary px-5 py-4 active:bg-app-primary-pressed"
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              Start Hair Analysis
            </Text>
          </Pressable>
        </View>
        
      </View>
      
    </SafeAreaView>
  );
}
const confirmedProfile = profile.confirmedProfile;
return (
  <SafeAreaView className="flex-1 bg-app-background">
    <ScrollView
      className="flex-1"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <HairProfileHeader onBack={() => router.back()} />

      <View>
        <ProfileRowPair
          leftLabel="Overall Length"
          leftValue={confirmedProfile?.overallLengthCategory}
          rightLabel="Texture"
          rightValue={confirmedProfile?.texture}
        />

        <ProfileRowPair
          leftLabel="Front Length"
          leftValue={confirmedProfile?.frontLengthInches}
          rightLabel="Side Length"
          rightValue={confirmedProfile?.sideLengthInches}
        />

        <ProfileRowPair
          leftLabel="Back Length"
          leftValue={confirmedProfile?.backLengthInches}
          rightLabel="Density"
          rightValue={confirmedProfile?.density}
        />

        <ProfileRow
          label="Current Style"
          value={confirmedProfile?.currentStyle}
        />

        <ProfileRowPair
          leftLabel="Face Shape"
          leftValue={confirmedProfile?.faceShape}
          rightLabel="Facial Hair"
          rightValue={confirmedProfile?.facialHair}
        />

        <ProfileRow
          label="Current Hairstyle"
          value={
            confirmedProfile?.currentHairstyle ||
            confirmedProfile?.fadeType
          }
        />
      </View>
      <Pressable
  onPress={() => router.replace("/client/hairProfile/uploadProfile")}
  className="mt-6 rounded-2xl border border-app-border bg-app-surface px-5 py-4 active:bg-app-surface-elevated"
>
  <Text className="text-center font-semibold text-app-text">
    Analyze Again
  </Text>
</Pressable>
    </ScrollView>
  </SafeAreaView>
);
}


function ProfileRow({ label, value }) {
  return (
    <View className="mb-3 rounded-2xl bg-app-surface-elevated px-4 py-4">
      <Text className="text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <Text className="mt-1 text-base font-medium text-app-text">
        {value === undefined || value === null || value === ""
          ? "Not provided"
          : String(value)}
      </Text>
    </View>
  );
}

function ProfileRowPair({
  leftLabel,
  leftValue,
  rightLabel,
  rightValue,
}) {
  return (
    <View className="mb-3 flex-row gap-3">
      <View className="flex-1 rounded-2xl bg-app-surface-elevated px-4 py-4">
        <Text className="text-sm font-semibold text-app-text-muted">
          {leftLabel}
        </Text>

        <Text className="mt-1 text-base font-medium text-app-text">
          {leftValue === undefined || leftValue === null || leftValue === ""
            ? "Not provided"
            : String(leftValue)}
        </Text>
      </View>

      <View className="flex-1 rounded-2xl bg-app-surface-elevated px-4 py-4">
        <Text className="text-sm font-semibold text-app-text-muted">
          {rightLabel}
        </Text>

        <Text className="mt-1 text-base font-medium text-app-text">
          {rightValue === undefined || rightValue === null || rightValue === ""
            ? "Not provided"
            : String(rightValue)}
        </Text>
      </View>
    </View>
  );
}
