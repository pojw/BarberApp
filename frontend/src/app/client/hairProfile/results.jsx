import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  TextInput,Pressable
} from "react-native";
import { useLocalSearchParams,useRouter } from "expo-router";

import CenterScreen from "../../../components/centerScreen";
import { auth } from "../../../config/firebase";
import { getHairProfile ,buildEditableHairProfile,confirmHairProfile} from "../../../services/hairProfileService";

export default function HairProfileResults() {
  const { profileId } = useLocalSearchParams();
const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    loadProfile();
  }, [profileId]);

  async function loadProfile() {
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
      const editableProfile = buildEditableHairProfile(
  result.originalAiPrediction
);

setForm(editableProfile);
    } catch (error) {
      console.log("Error loading hair profile:", error);
      setErrorMessage("Could not load hair profile results.");
    } finally {
      setLoading(false);
    }
  }
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
      <CenterScreen>
        <ActivityIndicator />
        <Text className="mt-3 text-gray-600">
          Loading analysis results...
        </Text>
      </CenterScreen>
    );
  }

  if (errorMessage) {
    return (
      <CenterScreen>
        <Text className="text-xl font-bold text-gray-900">
          Hair Analysis
        </Text>

        <Text className="mt-3 text-gray-600">
          {errorMessage}
        </Text>
      </CenterScreen>
    );
  }

  const prediction = profile?.originalAiPrediction;

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
          Your Hair Analysis
        </Text>

        <Text className="mt-3 text-base leading-6 text-gray-600">
          Review the information below. You will be able to correct anything
          that does not look right.
        </Text>

        <View className="mt-6 rounded-3xl border border-gray-200 bg-white p-5">
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
  onChangeText={(value) =>
    updateField("texture", value)
  }
/>

<EditableRow
  label="Density"
  value={form.density}
  onChangeText={(value) =>
    updateField("density", value)
  }
/>

<EditableRow
  label="Current Style"
  value={form.currentStyle}
  onChangeText={(value) =>
    updateField("currentStyle", value)
  }
/>

<EditableRow
  label="Face Shape"
  value={form.faceShape}
  onChangeText={(value) =>
    updateField("faceShape", value)
  }
/>

<EditableRow
  label="Facial Hair"
  value={form.facialHair}
  onChangeText={(value) =>
    updateField("facialHair", value)
  }
/>
<View className="border-b border-gray-100 py-4">
  <Text className="text-sm font-semibold text-gray-500">
    Fade or Taper
  </Text>

  <View className="mt-3 flex-row gap-3">
    <Pressable
      onPress={() =>
        updateField("hasFadeOrTaper", true)
      }
      className={`flex-1 rounded-xl border px-4 py-3 ${
        form.hasFadeOrTaper === true
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          form.hasFadeOrTaper === true
            ? "text-green-700"
            : "text-gray-700"
        }`}
      >
        Yes
      </Text>
    </Pressable>

    <Pressable
      onPress={() =>
        updateField("hasFadeOrTaper", false)
      }
      className={`flex-1 rounded-xl border px-4 py-3 ${
        form.hasFadeOrTaper === false
          ? "border-green-500 bg-green-50"
          : "border-gray-200 bg-white"
      }`}
    >
      <Text
        className={`text-center font-semibold ${
          form.hasFadeOrTaper === false
            ? "text-green-700"
            : "text-gray-700"
        }`}
      >
        No
      </Text>
    </Pressable>
  </View>
</View>

<EditableRow
  label="Neckline"
  value={form.neckline}
  onChangeText={(value) =>
    updateField("neckline", value)
  }
/>

<EditableRow
  label="Ear Coverage"
  value={form.earCoverage}
  onChangeText={(value) =>
    updateField("earCoverage", value)
  }
/>
{errorMessage ? (
  <View className="mt-4 rounded-2xl bg-red-50 p-4">
    <Text className="text-sm font-semibold text-red-600">
      {errorMessage}
    </Text>
  </View>
) : null}

<Pressable
  onPress={handleConfirm}
  disabled={saving}
  className={`mt-6 rounded-2xl px-5 py-4 ${
    saving ? "bg-gray-300" : "bg-green-500"
  }`}
>
  {saving ? (
    <ActivityIndicator color="white" />
  ) : (
    <Text className="text-center text-base font-bold text-white">
      Confirm Hair Profile
    </Text>
  )}
</Pressable>
        </View>
      </ScrollView>
    </CenterScreen>
  );
}

function EditableRow({
  label,
  value,
  onChangeText,
}) {
  return (
    <View className="border-b border-gray-100 py-4">
      <Text className="text-sm font-semibold text-gray-500">
        {label}
      </Text>

      <TextInput
        value={String(value ?? "")}
        onChangeText={onChangeText}
        className="mt-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-base text-gray-900"
        placeholder={`Enter ${label.toLowerCase()}`}
        placeholderTextColor="#9CA3AF"
      />
    </View>
  );
}