import { useState } from "react";
import { Image, View, Text, TextInput, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import CenterScreen from "../../components/centerScreen";

import { auth, db, storage } from "../../config/firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { useAuth } from "../../context/AuthContext";
function uriToBlob(imageUri) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.onload = () => {
      resolve(xhr.response);
    };

    xhr.onerror = () => {
      reject(new Error("Failed to read the selected image."));
    };

    xhr.responseType = "blob";
    xhr.open("GET", imageUri, true);
    xhr.send(null);
  });
}

async function uploadClientProfileImage({
  clientId,
  imageUri,
  mimeType = "image/jpeg",
}) {
  const storagePath = `clients/${clientId}/profile/profile.jpg`;
  const imageRef = ref(storage, storagePath);
  const imageBlob = await uriToBlob(imageUri);

  await uploadBytes(imageRef, imageBlob, {
    contentType: mimeType,
  });

  const downloadUrl = await getDownloadURL(imageRef);

  return {
    url: downloadUrl,
    storagePath,
  };
}

export default function ClientOnboarding() {
  const { refreshUserData } = useAuth();
  const router = useRouter();

  const [preferredName, setPreferredName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [profileImage, setProfileImage] = useState(null);

  async function handlePickProfileImage() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });

      if (result.canceled) {
        return;
      }

      setProfileImage(result.assets[0]);
    } catch (error) {
      console.log("Pick client profile image error:", error);
      Alert.alert("Image error", "Could not select that image.");
    }
  }

  async function handleFinish() {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert("Error", "No logged-in user found.");
      return;
    }

    if (!preferredName || !city || !state) {
      Alert.alert("Missing information", "Please fill out all fields.");
      return;
    }

    try {
      let uploadedProfileImage = null;

      if (profileImage?.uri) {
        uploadedProfileImage = await uploadClientProfileImage({
          clientId: user.uid,
          imageUri: profileImage.uri,
          mimeType: profileImage.mimeType || "image/jpeg",
        });
      }

      await setDoc(doc(db, "clients", user.uid), {
        userId: user.uid,
        preferredName: preferredName.trim(),
        location: {
          city: city.trim(),
          state: state.trim(),
        },
        profileImageUrl: uploadedProfileImage?.url || "",
        profileImagePath: uploadedProfileImage?.storagePath || "",
        favoriteBarbers: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await updateDoc(doc(db, "users", user.uid), {
        role: "client",
        onboarded: true,
        updatedAt: serverTimestamp(),
      });
      await refreshUserData();


      router.replace("/client/home");
    } catch (error) {
      console.log(error);
      Alert.alert("Client setup failed", error.message);
    }
  }

  return (
    <CenterScreen>
      <View className="w-full px-6">
        <View className="mb-4">
          <Text className="text-center text-3xl font-bold text-app-text">
            Client<Text className="text-app-primary">Setup</Text>
          </Text>
        </View>

        <View className="p-5">
          <View className="mb-6 items-center">
            <Pressable
              onPress={handlePickProfileImage}
              className="items-center"
            >
              {profileImage?.uri ? (
                <Image
                  source={{ uri: profileImage.uri }}
                  style={{ width: 108, height: 108, borderRadius: 54 }}
                  className="bg-app-surface-elevated"
                />
              ) : (
                <View
                  style={{ width: 108, height: 108, borderRadius: 54 }}
                  className="items-center justify-center bg-app-primary-soft"
                >
                  <Text className="text-5xl font-bold text-app-primary">
                    {(preferredName || "C").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}

              <Text className="mt-3 text-sm font-semibold text-app-primary">
                {profileImage?.uri ? "Change Photo" : "Add Photo"}
              </Text>

              <Text className="mt-1 text-xs font-semibold text-app-text-muted">
                (Optional)
              </Text>
            </Pressable>
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Preferred name
            </Text>
            <TextInput
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="Jaylin"
              placeholderTextColor="#8292A6"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>
<View className="mb-6">
  <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
    State
  </Text>
  <TextInput
    value={state}
    onChangeText={setState}
    placeholder="IN"
    placeholderTextColor="#8292A6"
    autoCapitalize="characters"
    maxLength={2}
    className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
  />
</View>
          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              City
            </Text>
            <TextInput
              value={city}
              onChangeText={setCity}
              placeholder="Indianapolis"
              placeholderTextColor="#8292A6"
              autoCapitalize="words"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />
          </View>

          <Pressable
            onPress={handleFinish}
            className="rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
          >
            <Text className="text-center text-base font-bold text-app-text-inverse">
              Finish Client Setup
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.back()}
            className="mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-app-text-muted">
              Back
            </Text>
          </Pressable>
        </View>
      </View>
    </CenterScreen>
  );
}
