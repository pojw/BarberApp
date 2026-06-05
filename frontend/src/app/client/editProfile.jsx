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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
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

export default function EditClientProfile() {
  const router = useRouter();

  const [preferredName, setPreferredName] = useState("");
  const [city, setCity] = useState("");
  const [stateValue, setStateValue] = useState("");
  const [haircutPreferences, setHaircutPreferences] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadClientProfile() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const clientRef = doc(db, "clients", currentUser.uid);
        const clientSnap = await getDoc(clientRef);

        if (!clientSnap.exists()) {
          Alert.alert("Profile not found", "Your client profile could not be found.");
          router.back();
          return;
        }

        const data = clientSnap.data();

        setPreferredName(data.preferredName || "");
        setCity(data.location?.city || "");
        setStateValue(data.location?.state || "");
        setHaircutPreferences(arrayToText(data.haircutPreferences));
      } catch (error) {
        console.log("Load client edit profile error:", error);
        Alert.alert("Error", "Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadClientProfile();
  }, []);

  async function handleSave() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!preferredName.trim()) {
        Alert.alert("Missing name", "Please enter your preferred name.");
        return;
      }

      setSaving(true);

      const clientRef = doc(db, "clients", currentUser.uid);

      await updateDoc(clientRef, {
        preferredName: preferredName.trim(),
        location: {
          city: city.trim(),
          state: stateValue.trim(),
        },
        haircutPreferences: textToArray(haircutPreferences),
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Profile updated", "Your client profile has been saved.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("Save client profile error:", error);
      Alert.alert("Save failed", "Something went wrong while saving your profile.");
    } finally {
      setSaving(false);
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
              Edit Client Profile
            </Text>
            <Text className="mt-2 text-base text-gray-500">
              Update your basic profile and haircut preferences.
            </Text>
          </View>

          <View className="rounded-3xl border border-gray-200 bg-white p-5">
            <FormInput
              label="Preferred Name"
              value={preferredName}
              onChangeText={setPreferredName}
              placeholder="Jaylin"
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
              label="Haircut Preferences"
              value={haircutPreferences}
              onChangeText={setHaircutPreferences}
              placeholder="Fade, taper, beard trim"
              multiline
            />

            <Text className="-mt-2 mb-6 text-xs text-gray-400">
              Separate preferences with commas.
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}