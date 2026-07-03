import { useState } from "react";
import CenterScreen from "../../../components/centerScreen";
import { useRouter } from "expo-router";
import { View, Text, Pressable, ScrollView } from "react-native";
import { ActivityIndicator } from "react-native";
import { auth } from "../../../config/firebase";
import { analyzeHairProfile } from "../../../services/hairProfileService";
const PHOTO_ANGLES = [
  {
    id: "front",
    label: "Front",
    description: "Shows hairline, face shape, front length, and overall style.",
  },
  {
    id: "left",
    label: "Left Side",
    description: "Shows side length, fade/taper shape, and ear coverage.",
  },
  {
    id: "right",
    label: "Right Side",
    description: "Helps compare both sides and spot uneven growth.",
  },
  {
    id: "back",
    label: "Back",
    description: "Shows neckline, back length, and taper details.",
  },
];

export default function UploadHairProfile() {
  const router = useRouter();
  const [selectedAngles, setSelectedAngles] = useState([]);

  function toggleAngle(angleId) {
    setSelectedAngles((currentAngles) => {
      if (currentAngles.includes(angleId)) {
        return currentAngles.filter((angle) => angle !== angleId);
      }

      return [...currentAngles, angleId];
    });
  }

  async function handleSubmit() {
  if (selectedAngles.length === 0) {
    setErrorMessage("Please select at least one photo angle.");
    return;
  }

  const currentUser = auth.currentUser;

  if (!currentUser) {
    setErrorMessage("You must be logged in to analyze your hair.");
    return;
  }

  try {
    setLoading(true);
    setErrorMessage("");

    const result = await analyzeHairProfile({
      clientId: currentUser.uid,
      photoAngles: selectedAngles,
    });

    router.push({
      pathname: "/client/hairProfile/results",
      params: {
        profileId: result.profileId,
      },
    });
  } catch (error) {
    console.log("Error analyzing hair profile:", error);
    setErrorMessage("Could not analyze your hair profile. Please try again.");
  } finally {
    setLoading(false);
  }
}
const [loading, setLoading] = useState(false);
const [errorMessage, setErrorMessage] = useState("");
  return (
    <CenterScreen>
      <ScrollView
        className="w-full"
        contentContainerStyle={{ paddingHorizontal: 24, paddingVertical: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-3xl bg-white p-6 shadow-sm border border-gray-100">
          <Text className="text-3xl font-bold text-gray-900">
            Upload Hair Photos
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-600">
            Choose which angles you want to provide. For now, these buttons
            simulate photo uploads so we can test the full hair profile flow.
          </Text>

          <View className="mt-6 rounded-2xl bg-green-50 p-4">
            <Text className="text-base font-semibold text-green-700">
              Recommended photos
            </Text>

            <Text className="mt-2 text-sm leading-5 text-gray-700">
              We recommend 3–4 angles for the best result: front, both sides,
              and back.
            </Text>
          </View>

          <View className="mt-6">
            <Text className="mb-3 text-lg font-bold text-gray-900">
              Select photo angles
            </Text>

            {PHOTO_ANGLES.map((angle) => {
              const isSelected = selectedAngles.includes(angle.id);

              return (
                <Pressable
                  key={angle.id}
                  onPress={() => toggleAngle(angle.id)}
                  className={`mb-3 rounded-2xl border p-4 ${
                    isSelected
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-3">
                      <Text
                        className={`text-base font-bold ${
                          isSelected ? "text-green-700" : "text-gray-900"
                        }`}
                      >
                        {angle.label}
                      </Text>

                      <Text className="mt-1 text-sm leading-5 text-gray-600">
                        {angle.description}
                      </Text>
                    </View>

                    <View
                      className={`h-7 w-7 items-center justify-center rounded-full border ${
                        isSelected
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          isSelected ? "text-white" : "text-gray-400"
                        }`}
                      >
                        {isSelected ? "✓" : ""}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <View className="mt-3 rounded-2xl bg-gray-50 p-4">
            <Text className="text-sm font-semibold text-gray-900">
              Selected:
            </Text>

            <Text className="mt-1 text-sm text-gray-600">
              {selectedAngles.length > 0
                ? selectedAngles.join(", ")
                : "No angles selected yet"}
            </Text>
          </View>
{errorMessage ? (
  <View className="mt-4 rounded-2xl bg-red-50 p-4">
    <Text className="text-sm font-semibold text-red-600">
      {errorMessage}
    </Text>
  </View>
) : null}
          <Pressable
            onPress={handleSubmit}
            className={`mt-6 rounded-2xl px-5 py-4 ${
              selectedAngles.length > 0 ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <Text className="text-center text-base font-bold text-white bg-black">
              Submit Hair Analysis
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-3 rounded-2xl border border-gray-200 px-5 py-4"
          >
            <Text className="text-center text-base font-semibold text-gray-700">
              Back
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </CenterScreen>
  );
}