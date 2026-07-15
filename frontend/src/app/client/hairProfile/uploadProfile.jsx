import { useRef, useState } from "react";
import { useRouter } from "expo-router";
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import CenterScreen from "../../../components/centerScreen";
import { auth } from "../../../config/firebase";
import {
  analyzeHairProfile,
  pickHairProfileImage,
  uploadHairProfilePhotos,
} from "../../../services/hairProfileService";

const PHOTO_ANGLES = [
  {
    id: "front",
    label: "Front Photo",
    description:
      "Face the camera directly and keep your hairline, face, and top of your hair visible.",
    icon: "person-outline",
  },
  {
    id: "left",
    label: "Left Side Photo",
    description:
      "Turn your left side toward the camera and keep the full side of your hair visible.",
    icon: "arrow-back-circle-outline",
  },
  {
    id: "right",
    label: "Right Side Photo",
    description:
      "Turn your right side toward the camera and keep the full side of your hair visible.",
    icon: "arrow-forward-circle-outline",
  },
  {
    id: "back",
    label: "Back Photo",
    description:
      "Face away from the camera and keep the back of your head and neckline visible.",
    icon: "scan-outline",
  },
];

export default function UploadHairProfile() {
  const router = useRouter();

  const [photosByAngle, setPhotosByAngle] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const submittingRef = useRef(false);

  async function handleAddPhoto(angleId) {
    try {
      const image = await pickHairProfileImage();

      if (!image) {
        return;
      }

      setPhotosByAngle((currentPhotos) => ({
        ...currentPhotos,
        [angleId]: image,
      }));

      setErrorMessage("");
    } catch (error) {
      console.log("Error picking hair profile photo:", error);
      setErrorMessage("Could not add that photo. Please try again.");
    }
  }

  function handleRemovePhoto(angleId) {
    setPhotosByAngle((currentPhotos) => {
      const updatedPhotos = {
        ...currentPhotos,
      };

      delete updatedPhotos[angleId];

      return updatedPhotos;
    });

    setErrorMessage("");
  }

  async function handleSubmit() {
    if (submittingRef.current || loading) {
      return;
    }

    const selectedAngles = Object.keys(photosByAngle);

    if (selectedAngles.length === 0) {
      setErrorMessage("Please add at least one hair photo.");
      return;
    }

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorMessage("You must be logged in to analyze your hair.");
      return;
    }

    submittingRef.current = true;

    try {
      setLoading(true);
      setErrorMessage("");

const uploadResult = await uploadHairProfilePhotos({
  clientId: currentUser.uid,
  photosByAngle,
});

const result = await analyzeHairProfile({
  clientId: currentUser.uid,
  photoAngles: Object.keys(uploadResult.photos),
  sourcePhotos: uploadResult.photos,
});

      router.replace({
        pathname: "/client/hairProfile/results",
        params: {
          profileId: result.profileId,
        },
      });
    } catch (error) {
      console.log("Error analyzing hair profile:", error);

      setErrorMessage(
        "Could not analyze your hair profile. Please try again."
      );

      submittingRef.current = false;
    } finally {
      setLoading(false);
    }
  }

  const photoCount = Object.keys(photosByAngle).length;
  const canSubmit = photoCount > 0 && !loading;

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
        <View className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
          <Text className="text-3xl font-bold text-gray-900">
            Upload Hair Photos
          </Text>

          <Text className="mt-3 text-base leading-6 text-gray-600">
            Add clear photos of your hair from each angle. These photos will
            help CutCare create a more accurate hair profile.
          </Text>

          <View className="mt-6 rounded-2xl bg-green-50 p-4">
            <View className="flex-row items-start">
              <Ionicons
                name="sparkles-outline"
                size={22}
                color="#15803D"
              />

              <View className="ml-3 flex-1">
                <Text className="text-base font-semibold text-green-700">
                  Photo tips
                </Text>

                <Text className="mt-1 text-sm leading-5 text-gray-700">
                  Use bright lighting, avoid hats, and keep your full head
                  inside the photo. Four angles will provide the best result.
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-7">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-lg font-bold text-gray-900">
                Your photos
              </Text>

              <Text className="text-sm font-semibold text-gray-500">
                {photoCount}/4 added
              </Text>
            </View>

            {PHOTO_ANGLES.map((angle) => {
              const photo = photosByAngle[angle.id];
              const hasPhoto = Boolean(photo);

              return (
                <View
                  key={angle.id}
                  className={`mb-4 overflow-hidden rounded-2xl border ${
                    hasPhoto
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View
                    className={`h-44 items-center justify-center ${
                      hasPhoto ? "bg-green-100" : "bg-gray-100"
                    }`}
                  >
                    {hasPhoto ? (
                      <>
                        <Image
                          source={{ uri: photo.uri }}
                          className="h-full w-full"
                          resizeMode="cover"
                        />

                        <View className="absolute right-3 top-3 h-9 w-9 items-center justify-center rounded-full bg-green-500">
                          <Ionicons
                            name="checkmark"
                            size={22}
                            color="#FFFFFF"
                          />
                        </View>
                      </>
                    ) : (
                      <>
                        <View className="h-14 w-14 items-center justify-center rounded-full bg-white">
                          <Ionicons
                            name={angle.icon}
                            size={28}
                            color="#6B7280"
                          />
                        </View>

                        <Text className="mt-3 text-sm font-semibold text-gray-500">
                          No photo added
                        </Text>
                      </>
                    )}
                  </View>

                  <View className="p-4">
                    <Text
                      className={`text-base font-bold ${
                        hasPhoto ? "text-green-700" : "text-gray-900"
                      }`}
                    >
                      {angle.label}
                    </Text>

                    <Text className="mt-1 text-sm leading-5 text-gray-600">
                      {angle.description}
                    </Text>

                    <Pressable
                      onPress={() => {
                        if (hasPhoto) {
                          handleRemovePhoto(angle.id);
                          return;
                        }

                        handleAddPhoto(angle.id);
                      }}
                      disabled={loading}
                      className={`mt-4 flex-row items-center justify-center rounded-xl px-4 py-3 ${
                        hasPhoto
                          ? "border border-gray-300 bg-white"
                          : "bg-green-500"
                      } ${loading ? "opacity-60" : ""}`}
                    >
                      <Ionicons
                        name={
                          hasPhoto
                            ? "trash-outline"
                            : "images-outline"
                        }
                        size={19}
                        color={hasPhoto ? "#374151" : "#FFFFFF"}
                      />

                      <Text
                        className={`ml-2 text-sm font-bold ${
                          hasPhoto ? "text-gray-700" : "text-white"
                        }`}
                      >
                        {hasPhoto ? "Remove Photo" : "Add Photo"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              );
            })}
          </View>

          <View className="rounded-2xl bg-gray-50 p-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-sm font-semibold text-gray-900">
                Photos added
              </Text>

              <Text className="text-sm font-bold text-gray-700">
                {photoCount} of 4
              </Text>
            </View>

            <View className="mt-3 h-2 overflow-hidden rounded-full bg-gray-200">
              <View
                className="h-full rounded-full bg-green-500"
                style={{
                  width: `${(photoCount / PHOTO_ANGLES.length) * 100}%`,
                }}
              />
            </View>

            <Text className="mt-2 text-sm leading-5 text-gray-600">
              {photoCount === 4
                ? "All recommended photos have been added."
                : "Add all four angles for the most complete analysis."}
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
            disabled={!canSubmit}
            className={`mt-6 flex-row items-center justify-center rounded-2xl px-5 py-4 ${
              canSubmit ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            {loading ? (
              <>
                <ActivityIndicator size="small" color="#FFFFFF" />

                <Text className="ml-2 text-center text-base font-bold text-white">
                  Analyzing...
                </Text>
              </>
            ) : (
              <>
                <Ionicons
                  name="sparkles-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text className="ml-2 text-center text-base font-bold text-white">
                  Submit Hair Analysis
                </Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            disabled={loading}
            className={`mt-3 rounded-2xl border border-gray-200 px-5 py-4 ${
              loading ? "opacity-50" : ""
            }`}
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
