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

  useEffect(() => {
    async function loadBarberProfile() {
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
              Edit Barber Profile
            </Text>
            <Text className="mt-2 text-base text-gray-500">
              Update the information clients will see on your profile.
            </Text>
          </View>

          <View className="rounded-3xl border border-gray-200 bg-white p-5">
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
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}