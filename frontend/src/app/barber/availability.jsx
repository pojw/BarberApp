import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import TimeInput from "../../components/barber/TimeInput";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";

const DAYS = [
  { key: "monday", label: "Monday" },
  { key: "tuesday", label: "Tuesday" },
  { key: "wednesday", label: "Wednesday" },
  { key: "thursday", label: "Thursday" },
  { key: "friday", label: "Friday" },
  { key: "saturday", label: "Saturday" },
  { key: "sunday", label: "Sunday" },
];

function buildDefaultAvailability() {
  return {
    monday: {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    tuesday: {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    wednesday: {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    thursday: {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    friday: {
      enabled: true,
      startTime: "09:00",
      endTime: "17:00",
    },
    saturday: {
      enabled: false,
      startTime: "10:00",
      endTime: "15:00",
    },
    sunday: {
      enabled: false,
      startTime: "10:00",
      endTime: "15:00",
    },
  };
}

function normalizeAvailability(value) {
  const defaults = buildDefaultAvailability();

  if (!value || typeof value !== "object") {
    return defaults;
  }

  const normalized = {};

  DAYS.forEach((day) => {
    normalized[day.key] = {
      enabled:
        typeof value?.[day.key]?.enabled === "boolean"
          ? value[day.key].enabled
          : defaults[day.key].enabled,
      startTime: value?.[day.key]?.startTime || defaults[day.key].startTime,
      endTime: value?.[day.key]?.endTime || defaults[day.key].endTime,
    };
  });

  return normalized;
}

function isValidTime(value) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export default function BarberAvailability() {
  const router = useRouter();

  const [availability, setAvailability] = useState(buildDefaultAvailability());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  useEffect(() => {
    async function loadAvailability() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const barberRef = doc(db, "barbers", currentUser.uid);
        const barberSnap = await getDoc(barberRef);

        if (!barberSnap.exists()) {
          Alert.alert(
            "Profile not found",
            "Your barber profile could not be found."
          );
          router.back();
          return;
        }

        const data = barberSnap.data();
        const existingAvailability = normalizeAvailability(data.availability);

        setAvailability(existingAvailability);
      } catch (error) {
        console.log("Load barber availability error:", error);
        Alert.alert(
          "Error",
          "Something went wrong while loading availability."
        );
      } finally {
        setLoading(false);
      }
    }

    loadAvailability();
  }, []);

  function updateDay(dayKey, field, value) {
    setAvailability((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        [field]: value,
      },
    }));
  }

  function toggleDay(dayKey) {
    setAvailability((current) => ({
      ...current,
      [dayKey]: {
        ...current[dayKey],
        enabled: !current[dayKey].enabled,
      },
    }));
  }

  function validateAvailability() {
    for (const day of DAYS) {
      const dayData = availability[day.key];

      if (!dayData.enabled) {
        continue;
      }

      if (!isValidTime(dayData.startTime)) {
        Alert.alert(
          "Invalid start time",
          `${day.label} start time must be in HH:MM format, like 09:00.`
        );
        return false;
      }

      if (!isValidTime(dayData.endTime)) {
        Alert.alert(
          "Invalid end time",
          `${day.label} end time must be in HH:MM format, like 17:00.`
        );
        return false;
      }

      if (timeToMinutes(dayData.startTime) >= timeToMinutes(dayData.endTime)) {
        Alert.alert(
          "Invalid time range",
          `${day.label} start time must be before the end time.`
        );
        return false;
      }
    }

    return true;
  }

  async function handleSave() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (!validateAvailability()) {
        return;
      }

      setSaving(true);

      const barberRef = doc(db, "barbers", currentUser.uid);

      await updateDoc(barberRef, {
        availability,
        updatedAt: serverTimestamp(),
      });

      Alert.alert("Availability saved", "Your weekly schedule was updated.", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.log("Save barber availability error:", error);
      Alert.alert(
        "Save failed",
        "Something went wrong while saving your availability."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    router.back();
  }

  function renderDay({ item: day }) {
    const dayData = availability[day.key];

    return (
      <View className="mb-5 rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-black">{day.label}</Text>
            <Text className="mt-1 text-sm text-gray-500">
              {dayData.enabled ? "Open" : "Closed"}
            </Text>
          </View>

          <Pressable
            onPress={() => toggleDay(day.key)}
            disabled={saving}
            className={`rounded-full px-4 py-2 ${
              dayData.enabled ? "bg-black" : "bg-gray-200"
            }`}
          >
            <Text
              className={`text-sm font-bold ${
                dayData.enabled ? "text-white" : "text-black"
              }`}
            >
              {dayData.enabled ? "Open" : "Closed"}
            </Text>
          </Pressable>
        </View>

        <View
          className={`flex-row gap-3 ${
            !dayData.enabled ? "opacity-40" : ""
          }`}
        >
          <View className="flex-1">
            <TimeInput
  label="Start"
  value={dayData.startTime}
  onChange={(value) => updateDay(day.key, "startTime", value)}
  disabled={!dayData.enabled || saving}
  onWheelTouchStart={() => setParentScrollEnabled(false)}
  onWheelTouchEnd={() => setParentScrollEnabled(true)}
/>
          </View>

          <View className="flex-1">
            <TimeInput
  label="End"
  value={dayData.endTime}
  onChange={(value) => updateDay(day.key, "endTime", value)}
  disabled={!dayData.enabled || saving}
  onWheelTouchStart={() => setParentScrollEnabled(false)}
  onWheelTouchEnd={() => setParentScrollEnabled(true)}
/>
          </View>
        </View>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading availability...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={DAYS}
          keyExtractor={(item) => item.key}
          renderItem={renderDay}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-6 py-6"
        scrollEnabled={parentScrollEnabled}

          ListHeaderComponent={
            <View>
              <View className="mb-8">
                <Text className="text-3xl font-bold text-black">
                  Manage Availability
                </Text>
                <Text className="mt-2 text-base text-gray-500">
                  Set the days and times clients can request appointments.
                </Text>
              </View>

              <View className="mb-5">
                <Text className="text-xl font-bold text-black">
                  Weekly Schedule
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={
            <View>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className={`rounded-2xl px-4 py-4 active:opacity-80 ${
                  saving ? "bg-gray-400" : "bg-black"
                }`}
              >
                <Text className="text-center text-base font-bold text-white">
                  {saving ? "Saving..." : "Save Availability"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                disabled={saving}
                className="mt-4 mb-10 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
              >
                <Text className="text-center text-base font-bold text-black">
                  Cancel
                </Text>
              </Pressable>
            </View>
          }
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}