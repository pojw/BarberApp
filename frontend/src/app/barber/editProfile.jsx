import { useEffect, useState } from "react";
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
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";

import {
  pickImage,uploadBarberProfileImage,  uploadBarberPortfolioImage,
  deleteBarberPortfolioImage,
}from "../../services/barberImageService"
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
      <Text className="mb-2 text-sm font-semibold text-gray-700">{label}</Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#9CA3AF"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize="sentences"
        className={`rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black ${
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

const [uploadingPortfolioImage, setUploadingPortfolioImage] =
  useState(false);

const [portfolioImageError, setPortfolioImageError] =
  useState("");

  useEffect(() => {
    async function loadBarberProfile() {
      try {
        const currentUser = auth.currentUser;
        console.log("Current user:", currentUser);
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
  Array.isArray(data.portfolioImages)
    ? data.portfolioImages
    : []
);
        setProfileImageUrl(data.profileImageUrl || "");
        setBusinessName(data.businessName || "");
        setPhone(data.phone || "");
        setBio(data.bio || "");
        setCity(data.location?.city || "");
        setStateValue(data.location?.state || "");
        setSpecialties(arrayToText(data.specialties));

      } catch (error) {
  console.log("Storage error code:", error.code);
  console.log("Storage error message:", error.message);
  console.log("Storage custom data:", error.customData);
  console.log("Full storage error:", error);

  setProfileImageError(
    "Unable to upload profile image. Please try again."
  );
        Alert.alert("Error", "Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadBarberProfile();
  }, []);

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

  async function handlePortfolioImageUpload() {
  if (uploadingPortfolioImage) {
    return;
  }

  if (portfolioImages.length >= MAX_PORTFOLIO_IMAGES) {
    Alert.alert(
      "Portfolio limit reached",
      "You can upload a maximum of 8 portfolio images."
    );
    return;
  }

  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    setPortfolioImageError("");

    const selectedImage = await pickImage();

    if (!selectedImage) {
      return;
    }

    setUploadingPortfolioImage(true);

    const uploadedImage =
      await uploadBarberPortfolioImage({
        barberId: currentUser.uid,
        imageUri: selectedImage.uri,
        mimeType: selectedImage.mimeType,
      });

    setPortfolioImages((currentImages) => [
      ...currentImages,
      uploadedImage,
    ]);

    Alert.alert(
      "Success",
      "Portfolio image uploaded successfully."
    );
  } catch (error) {
    console.log("Portfolio upload error:", error);
    console.log("Portfolio error code:", error.code);
  console.log("Portfolio error message:", error.message);
  console.log("Portfolio custom data:", error.customData);
  console.log("Full portfolio error:", error);

    setPortfolioImageError(
      "Unable to upload portfolio image. Please try again."
    );
  } finally {
    setUploadingPortfolioImage(false);
  }
}

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading edit profile...</Text>
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
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >

          <View className="mb-8">
            <Text className="text-3xl font-bold text-black">
              Edit Barber Profile
            </Text>

            <Text className="mt-2 text-base text-gray-500">
              Update the information clients will see on your profile.
            </Text>
          </View>
          

          <View className="rounded-3xl border border-gray-200 bg-white p-5">
            
            <View className="items-center mb-6">
  {displayedProfileImage ? (
    <Image
      source={{ uri: displayedProfileImage }}
      className="w-28 h-28 rounded-full"
    />
  ) : (
    <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
      <Text className="text-gray-500">
        No Photo
      </Text>
    </View>
  )}

  <Pressable
    onPress={handleProfileImageUpload}
    disabled={uploadingProfileImage}
    className={`mt-4 px-5 py-3 rounded-xl ${
      uploadingProfileImage
        ? "bg-gray-400"
        : "bg-black"
    }`}
  >
    {uploadingProfileImage ? (
      <View className="flex-row items-center gap-2">
        <ActivityIndicator />
        <Text className="text-white font-semibold">
          Uploading...
        </Text>
      </View>
    ) : (
      <Text className="text-white font-semibold">
        Change Profile Image
      </Text>
    )}
  </Pressable>

  {profileImageError ? (
    <Text className="text-red-500 mt-2 text-center">
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
              placeholder="Curly hair, designs, beard work"
            />

            <Text className="-mt-2 mb-6 text-xs text-gray-400">
              Separate specialties with commas.
            </Text>

            <Pressable
              onPress={handleSave}
              disabled={saving}
              className={`rounded-2xl px-4 py-4 active:opacity-80 ${
                saving ? "bg-gray-400" : "bg-black"
              }`}
            >
              <Text className="text-center text-base font-bold text-white">
                {saving ? "Saving..." : "Save Changes"}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => router.back()}
              disabled={saving}
              className="mt-4 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
            >
              <Text className="text-center text-base font-bold text-black">
                Cancel
              </Text>
            </Pressable>
          </View>
          <View className="mb-8">
  <View className="mb-4 flex-row items-center justify-between">
    <Text className="text-lg font-bold text-black">
      Portfolio
    </Text>

    <Text className="text-sm text-gray-500">
      {portfolioImages.length}/{MAX_PORTFOLIO_IMAGES}
    </Text>
  </View>

  {portfolioImages.length > 0 ? (
    <View className="flex-row flex-wrap gap-3">
      {portfolioImages.map((image) => (
  <View
    key={image.id}
    className="relative"
  >
    <Image
      source={{ uri: image.url }}
      className="h-28 w-28 rounded-xl"
    />

    <Pressable
      onPress={() =>
        handleDeletePortfolioImage(image)
      }
      className="absolute right-1 top-1 rounded-full bg-black/70 px-2 py-1"
    >
      <Text className="text-xs font-bold text-white">
        Delete
      </Text>
    </Pressable>
  </View>
))}
    </View>
  ) : (
    <View className="rounded-2xl bg-gray-100 px-4 py-6">
      <Text className="text-center text-gray-500">
        No portfolio images yet.
      </Text>
    </View>
  )}

  <Pressable
    onPress={handlePortfolioImageUpload}
    disabled={
      uploadingPortfolioImage ||
      portfolioImages.length >= MAX_PORTFOLIO_IMAGES
    }
    className={`mt-4 rounded-xl px-5 py-3 ${
      uploadingPortfolioImage ||
      portfolioImages.length >= MAX_PORTFOLIO_IMAGES
        ? "bg-gray-400"
        : "bg-black"
    }`}
  >
    {uploadingPortfolioImage ? (
      <View className="flex-row items-center justify-center gap-2">
        <ActivityIndicator />

        <Text className="font-semibold text-white">
          Uploading...
        </Text>
      </View>
    ) : (
      <Text className="text-center font-semibold text-white">
        Add Portfolio Image
      </Text>
    )}
  </Pressable>

  {portfolioImages.length >= MAX_PORTFOLIO_IMAGES ? (
    <Text className="mt-2 text-center text-sm text-gray-500">
      Portfolio image limit reached.
    </Text>
  ) : null}

  {portfolioImageError ? (
    <Text className="mt-2 text-center text-red-500">
      {portfolioImageError}
    </Text>
  ) : null}
</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
