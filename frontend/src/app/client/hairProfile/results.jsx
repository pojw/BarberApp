import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

import { auth } from "../../../config/firebase";
import {
  getHairProfile,
  buildEditableHairProfile,
  confirmHairProfile,
} from "../../../services/hairProfileService";

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
        Hair<Text className="text-app-primary">Results</Text>
      </Text>

      <View className="h-11 w-11" />
    </View>
  );
}

export default function HairProfileResults() {
  const { profileId } = useLocalSearchParams();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setErrorMessage("You must be logged in.");
        return;
      }

      if (!profileId) {
        setErrorMessage("Missing profile ID.");
        return;
      }

      const result = await getHairProfile({
        clientId: currentUser.uid,
        profileId,
      });

      setProfile(result);
      setForm(buildEditableHairProfile(result.originalAiPrediction));
    } catch (error) {
      console.log("Error loading hair profile:", error);
      setErrorMessage("Could not load hair profile results.");
    } finally {
      setLoading(false);
    }
  }, [profileId]);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      loadProfile();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadProfile]);

  async function handleConfirm() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorMessage("You must be logged in.");
      return;
    }

    if (!profileId) {
      setErrorMessage("Missing profile ID.");
      return;
    }

    try {
      setSaving(true);
      setErrorMessage("");

      await confirmHairProfile({
        clientId: currentUser.uid,
        profileId,
        confirmedProfile: form,
        originalAiPrediction: profile.originalAiPrediction,
      });

      router.replace("/client/hairProfile");
    } catch (error) {
      console.log("Error confirming hair profile:", error);
      setErrorMessage("Could not save your hair profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function updateField(fieldName, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [fieldName]: value,
    }));
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator />
        <Text className="mt-3 text-app-text-muted">
          Loading analysis results...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage && !profile) {
    return (
      <SafeAreaView className="flex-1 bg-app-background">
        <View className="flex-1 px-6 py-6">
          <HairProfileHeader onBack={() => router.back()} />

          <Text className="mt-3 text-app-text-muted">
            {errorMessage}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

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

        <Text className="mb-4 text-base leading-6 text-app-text-secondary">
          Review the information below and correct anything that does not look right.
        </Text>

        <View>
          <EditableRow
            label="Overall Length"
            value={form.overallLengthCategory}
            onChangeText={(value) =>
              updateField("overallLengthCategory", value)
            }
          />

          <EditableRow
            label="Front Length"
            value={form.frontLengthInches}
            onChangeText={(value) =>
              updateField("frontLengthInches", value)
            }
          />

          <EditableRow
            label="Side Length"
            value={form.sideLengthInches}
            onChangeText={(value) =>
              updateField("sideLengthInches", value)
            }
          />

          <EditableRow
            label="Back Length"
            value={form.backLengthInches}
            onChangeText={(value) =>
              updateField("backLengthInches", value)
            }
          />

          <EditableRow
            label="Texture"
            value={form.texture}
            onChangeText={(value) => updateField("texture", value)}
          />

          <EditableRow
            label="Density"
            value={form.density}
            onChangeText={(value) => updateField("density", value)}
          />

          <EditableRow
            label="Current Style"
            value={form.currentStyle}
            onChangeText={(value) => updateField("currentStyle", value)}
          />

          <EditableRow
            label="Face Shape"
            value={form.faceShape}
            onChangeText={(value) => updateField("faceShape", value)}
          />

          <EditableRow
            label="Facial Hair"
            value={form.facialHair}
            onChangeText={(value) => updateField("facialHair", value)}
          />

          <View className="mb-3 rounded-2xl bg-app-surface-elevated px-4 py-4">
            <Text className="text-sm font-semibold text-app-text-muted">
              Fade or Taper
            </Text>

            <View className="mt-3 flex-row gap-3">
              <Pressable
                onPress={() => updateField("hasFadeOrTaper", true)}
                className={`flex-1 rounded-xl px-4 py-3 ${
                  form.hasFadeOrTaper === true
                    ? "bg-app-primary"
                    : "border border-app-border bg-app-surface"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    form.hasFadeOrTaper === true
                      ? "text-app-text-inverse"
                      : "text-app-text-secondary"
                  }`}
                >
                  Yes
                </Text>
              </Pressable>

              <Pressable
                onPress={() => updateField("hasFadeOrTaper", false)}
                className={`flex-1 rounded-xl px-4 py-3 ${
                  form.hasFadeOrTaper === false
                    ? "bg-app-primary"
                    : "border border-app-border bg-app-surface"
                }`}
              >
                <Text
                  className={`text-center font-semibold ${
                    form.hasFadeOrTaper === false
                      ? "text-app-text-inverse"
                      : "text-app-text-secondary"
                  }`}
                >
                  No
                </Text>
              </Pressable>
            </View>
          </View>

          <EditableRow
            label="Current Hairstyle"
            value={form.currentHairstyle || form.fadeType}
            onChangeText={(value) => updateField("currentHairstyle", value)}
          />

          {errorMessage ? (
            <View className="mt-4 rounded-2xl bg-app-surface-elevated p-4">
              <Text className="text-sm font-semibold text-app-error">
                {errorMessage}
              </Text>
            </View>
          ) : null}

          <Pressable
            onPress={handleConfirm}
            disabled={saving}
            className={`mt-6 rounded-2xl px-5 py-4 ${
              saving
                ? "bg-app-disabled"
                : "bg-app-primary active:bg-app-primary-pressed"
            }`}
          >
            {saving ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-center text-base font-bold text-app-text-inverse">
                Confirm Hair Profile
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function EditableRow({ label, value, onChangeText }) {
  return (
    <View className="mb-3 rounded-2xl bg-app-surface-elevated px-4 py-4">
      <Text className="text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <TextInput
        value={String(value ?? "")}
        onChangeText={onChangeText}
        className="mt-2 rounded-xl border border-app-border bg-app-surface px-4 py-3 text-base text-app-text"
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#8292A6"
      />
    </View>
  );
}
