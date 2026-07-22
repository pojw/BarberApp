import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";

import {
  pickImage, uploadBarberProfileImage,
  deleteBarberPortfolioImage,
} from "../../services/barberImageService";
const MAX_PORTFOLIO_IMAGES = 8;

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8292A6"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
        className={`rounded-2xl border border-app-border bg-app-surface px-4 py-4 text-base text-app-text ${
          multiline ? "min-h-28 text-top" : ""
        }`}
      />
    </View>
  );
}

function textToArray(text) {
  return text
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function arrayToText(value) {
  if (!Array.isArray(value)) return "";
  return value.join(", ");
}

function EditProfileHeader({ onBack }) {
  return (
    <View className="mb-8 flex-row items-center">
      <Pressable
        onPress={onBack}
        className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons name="arrow-back" size={24} color="#1677FF" />
      </Pressable>

      <Text className="flex-1 text-center text-3xl font-bold text-app-text">
        Edit<Text className="text-app-primary">Profile</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function EditBarberProfile() {
  const router = useRouter();

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [specialties, setSpecialties] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);


  const [selectedProfileImage, setSelectedProfileImage] =
  useState(null);
const [profileImageUrl, setProfileImageUrl] =
  useState("");
const [uploadingProfileImage, setUploadingProfileImage] =
  useState(false);

const [profileImageError, setProfileImageError] =
  useState("");
  // Additional state for portfolio images
  const [portfolioImages, setPortfolioImages] =
  useState([]);

const [portfolioImageError, setPortfolioImageError] =
  useState("");

  const loadBarberProfile = useCallback(async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      const barberRef = doc(db, "barbers", currentUser.uid);
      const barberSnap = await getDoc(barberRef);

      if (!barberSnap.exists()) {
        Alert.alert("Profile not found", "Your barber profile could not be found.");
        router.back();
        return;
      }

      const data = barberSnap.data();

      setPortfolioImages(
        Array.isArray(data.portfolioImages) ? data.portfolioImages : []
      );
      setProfileImageUrl(data.profileImageUrl || "");
      setBusinessName(data.businessName || "");
      setPhone(data.phone || "");
      setBio(data.bio || "");
      setCity(data.location?.city || "");
      setStateValue(data.location?.state || "");
      setSpecialties(arrayToText(data.specialties));
    } catch (error) {
      console.log("Load barber edit profile error:", error);
      Alert.alert("Error", "Something went wrong while loading your profile.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadBarberProfile();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadBarberProfile]);

  async function handleSave() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!businessName.trim()) {
        Alert.alert("Missing business name", "Please enter your business name.");
        return;
      }

      setSaving(true);

      const barberRef = doc(db, "barbers", currentUser.uid);

      await updateDoc(barberRef, {
        businessName: businessName.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        location: {
          city: city.trim(),
          state: stateValue.trim(),
        },
        specialties: textToArray(specialties),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Profile updated", "Your barber profile has been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("Save barber profile error:", error);
  console.log("Portfolio error code:", error.code);
  console.log("Portfolio error message:", error.message);
  console.log("Portfolio custom data:", error.customData);
  console.log("Full portfolio error:", error);

  setPortfolioImageError(
    "Unable to upload portfolio image. Please try again."
  );

      Alert.alert("Save failed", "Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
    }
  }
  const displayedProfileImage =
  selectedProfileImage?.uri ||
  profileImageUrl ||
  null;

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading edit profile...</Text>
      </SafeAreaView>
    );
  }
async function handleProfileImageUpload() {
  if (uploadingProfileImage) {
    return;
  }

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setProfileImageError("");

    const selectedImage = await pickImage({
      aspect: [1, 1],
    });

    if (!selectedImage) {
      return;
    }

    setSelectedProfileImage(selectedImage);
    setUploadingProfileImage(true);

    const uploadedImage =
      await uploadBarberProfileImage({
        barberId: currentUser.uid,
        imageUri: selectedImage.uri,
        mimeType: selectedImage.mimeType,
      });

    setProfileImageUrl(uploadedImage.url);

    Alert.alert(
      "Success",
      "Profile image updated successfully."
    );
  }catch (error) {
  console.log("Storage error code:", error.code);
  console.log("Storage error message:", error.message);
  console.log("Storage custom data:", error.customData);
  console.log("Full storage error:", error);

  setProfileImageError(
    "Unable to upload profile image. Please try again."
  );

  } finally {
    setUploadingProfileImage(false);
  }
}
function handleDeletePortfolioImage(image) {
  Alert.alert(
    "Delete portfolio image?",
    "This image will be permanently removed from your portfolio.",
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
              router.replace("/login");
              return;
            }

            setPortfolioImageError("");

            await deleteBarberPortfolioImage({
              barberId: currentUser.uid,
              image,
            });

            setPortfolioImages((currentImages) =>
              currentImages.filter(
                (portfolioImage) =>
                  portfolioImage.id !== image.id
              )
            );
          } catch (error) {
            console.log(
              "Portfolio delete error:",
              error
            );

            setPortfolioImageError(
              "Unable to delete portfolio image. Please try again."
            );
          }
        },
      },
    ]
  );
}
  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <EditProfileHeader onBack={() => router.back()} />

          <View className="rounded-3xl bg-app-surface p-5">
            
            <View className="items-center mb-6">
  {displayedProfileImage ? (
    <Image
      source={{ uri: displayedProfileImage }}
      className="w-28 h-28 rounded-full"
    />
  ) : (
    <View className="w-28 h-28 rounded-full bg-app-primary-soft items-center justify-center">
      <Text className="text-app-primary font-semibold">
        No Photo
      </Text>
    </View>
  )}

  <Pressable
    onPress={handleProfileImageUpload}
    disabled={uploadingProfileImage}
    className={`mt-4 px-5 py-3 rounded-xl ${
      uploadingProfileImage
        ? "bg-app-disabled"
        : "bg-app-primary active:bg-app-primary-pressed"
    }`}
  >
    {uploadingProfileImage ? (
      <View className="flex-row items-center gap-2">
        <ActivityIndicator color="white" />
        <Text className="text-app-text-inverse font-semibold">
          Uploading...
        </Text>
      </View>
    ) : (
      <Text className="text-app-text-inverse font-semibold">
        Change Profile Image
      </Text>
    )}
  </Pressable>

  {profileImageError ? (
    <Text className="text-app-error mt-2 text-center">
      {profileImageError}
    </Text>
  ) : null}
</View>
            <FormInput
              label="Business Name"
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Your barber or shop name"
            />

            <FormInput
              label="Phone"
              value={phone}
              onChangeText={setPhone}
              placeholder="Your phone number"
              keyboardType="phone-pad"
            />

            <FormInput
              label="Bio"
              value={bio}
              onChangeText={setBio}
              placeholder="Tell clients about your experience, style, or shop"
              multiline
            />

            <FormInput
              label="City"
              value={city}
              onChangeText={setCity}
              placeholder="Indianapolis"
            />

            <FormInput
              label="State"
              value={stateValue}
              onChangeText={setStateValue}
              placeholder="IN"
            />

            

           

            <FormInput
              label="Specialties"
              value={specialties}
              onChangeText={setSpecialties}
              placeholder="Curly hair and designs and beard work"
            />

            <View className="mb-6">
              <View className="mb-4 flex-row items-center justify-between">
                <Text className="text-lg font-bold text-app-text">
                  Portfolio
                </Text>

                <Text className="text-sm text-app-text-muted">
                  {portfolioImages.length}/{MAX_PORTFOLIO_IMAGES}
                </Text>
              </View>

              {portfolioImages.length > 0 ? (
                <View className="flex-row flex-wrap gap-3">
                  {portfolioImages.map((image) => (
                    <View key={image.id} className="relative">
                      <Image
                        source={{ uri: image.url }}
                        className="h-28 w-28 rounded-xl"
                      />

                      <Pressable
                        onPress={() => handleDeletePortfolioImage(image)}
                        className="absolute right-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-app-primary"
                      >
                        <Ionicons name="close" size={18} color="#FFFFFF" />
                      </Pressable>
                    </View>
                  ))}
                </View>
              ) : (
                <View className="rounded-2xl bg-app-surface-elevated px-4 py-6">
                  <Text className="text-center text-app-text-muted">
                    No portfolio images yet.
                  </Text>
                </View>
              )}

              {portfolioImageError ? (
                <Text className="mt-2 text-center text-app-error">
                  {portfolioImageError}
                </Text>
              ) : null}
            </View>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`rounded-2xl px-4 py-4 ${
                saving
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              className="mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
            >
              <Text className="text-center text-base font-bold text-app-text">
                Cancel
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
