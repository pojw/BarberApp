import { useEffect, useState } from "react";
import { View, Text, Pressable, ScrollView, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";

import CenterScreen from "../../../components/centerScreen";
import { auth } from "../../../config/firebase";
import { getActiveHairProfile } from "../../../services/hairProfileService";
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
    <CenterScreen>
      <ActivityIndicator />
      <Text className="mt-3 text-gray-600">
        Loading hair profile...
      </Text>
    </CenterScreen>
  );
}
if (errorMessage) {
  return (
    <CenterScreen>
      <View className="w-full px-6">
        <Text className="text-2xl font-bold text-gray-900">
          Hair Profile
        </Text>

        <Text className="mt-3 text-gray-600">
          {errorMessage}
        </Text>

        <Pressable
          onPress={loadActiveProfile}
          className="mt-6 rounded-2xl bg-black px-5 py-4"
        >
          <Text className="text-center font-semibold text-white">
            Try Again
          </Text>
        </Pressable>
      </View>
    </CenterScreen>
  );
}
if (!profile) {
  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="rounded-3xl border border-gray-100 bg-white p-6">
          <Text className="text-3xl font-bold text-gray-900">
            Hair Profile
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-600">
            Analyze your current hair so BarberApp can give better haircut
            recommendations based on your current hair and style goals.
          </Text>

          <Pressable
            onPress={() =>
              router.push("/client/hairProfile/uploadProfile")
            }
            className="mt-6 rounded-2xl bg-green-500 px-5 py-4"
          >
            <Text className="text-center text-base font-bold text-white">
              Start Hair Analysis
            </Text>
          </Pressable>
        </View>
        
      </View>
      
    </CenterScreen>
  );
}
const confirmedProfile = profile.confirmedProfile;
return (
  <CenterScreen>
    <ScrollView
      className="w-full"
      contentContainerStyle={{
        paddingHorizontal: 24,
        paddingVertical: 24,
      }}
      showsVerticalScrollIndicator={false}
    >
      <Text className="text-3xl font-bold text-gray-900">
        Your Hair Profile
      </Text>

      <Text className="mt-2 text-base leading-6 text-gray-600">
        This profile is used to improve your haircut recommendations.
      </Text>

      <View className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
        <ProfileRow
          label="Overall Length"
          value={confirmedProfile?.overallLengthCategory}
        />

        <ProfileRow
          label="Front Length"
          value={confirmedProfile?.frontLengthInches}
        />

        <ProfileRow
          label="Side Length"
          value={confirmedProfile?.sideLengthInches}
        />

        <ProfileRow
          label="Back Length"
          value={confirmedProfile?.backLengthInches}
        />

        <ProfileRow
          label="Texture"
          value={confirmedProfile?.texture}
        />

        <ProfileRow
          label="Density"
          value={confirmedProfile?.density}
        />

        <ProfileRow
          label="Current Style"
          value={confirmedProfile?.currentStyle}
        />

        <ProfileRow
          label="Face Shape"
          value={confirmedProfile?.faceShape}
        />

        <ProfileRow
          label="Facial Hair"
          value={confirmedProfile?.facialHair}
        />

        <ProfileRow
          label="Fade or Taper"
          value={
            confirmedProfile?.hasFadeOrTaper === true
              ? "Yes"
              : confirmedProfile?.hasFadeOrTaper === false
                ? "No"
                : null
          }
        />

        <ProfileRow
          label="Fade Type"
          value={confirmedProfile?.fadeType}
        />

        <ProfileRow
          label="Neckline"
          value={confirmedProfile?.neckline}
        />

        <ProfileRow
          label="Ear Coverage"
          value={confirmedProfile?.earCoverage}
        />
      </View>
      <Pressable
  onPress={() => router.replace("/client/hairProfile/uploadProfile")}
  className="mt-6 rounded-2xl border border-gray-300 px-5 py-4"
>
  <Text className="text-center font-semibold text-gray-800">
    Analyze Again
  </Text>
</Pressable>
    </ScrollView>
  </CenterScreen>
);
}


function ProfileRow({ label, value }) {
  return (
    <View className="border-b border-gray-100 py-4">
      <Text className="text-sm font-semibold text-gray-500">
        {label}
      </Text>

      <Text className="mt-1 text-base font-medium text-gray-900">
        {value === undefined || value === null || value === ""
          ? "Not provided"
          : String(value)}
      </Text>
    </View>
  );
}