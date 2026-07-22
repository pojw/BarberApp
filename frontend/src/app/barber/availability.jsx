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
import { Ionicons } from "@expo/vector-icons";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";

const DAYS = [
  { key: "monday", label: "Monday", shortLabel: "M" },
  { key: "tuesday", label: "Tuesday", shortLabel: "T" },
  { key: "wednesday", label: "Wednesday", shortLabel: "W" },
  { key: "thursday", label: "Thursday", shortLabel: "T" },
  { key: "friday", label: "Friday", shortLabel: "F" },
  { key: "saturday", label: "Saturday", shortLabel: "S" },
  { key: "sunday", label: "Sunday", shortLabel: "S" },
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
  const [selectedDayKey, setSelectedDayKey] = useState(DAYS[0].key);

  const selectedDay =
    DAYS.find((day) => day.key === selectedDayKey) || DAYS[0];

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
  }, [router]);

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

  function handleSelectDay(dayKey) {
    setParentScrollEnabled(true);
    setSelectedDayKey(dayKey);
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

      Alert.alert("Availability saved", "Your weekly schedule was updated.");
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
    const dayContent = (
      <>
        <View className="mb-4 flex-row items-center justify-between">
          <View>
            <Text className="text-lg font-bold text-app-text">{day.label}</Text>
          </View>

          {dayData.enabled ? (
            <Pressable
              onPress={() => toggleDay(day.key)}
              disabled={saving}
              className="rounded-full bg-app-surface-elevated px-4 py-2 active:bg-app-primary-soft"
            >
              <Text className="text-sm font-bold text-app-text-secondary">
                Close Day
              </Text>
            </Pressable>
          ) : (
            <View className="rounded-full bg-app-primary px-4 py-2">
              <Text className="text-sm font-bold text-app-text-inverse">
                Open Day
              </Text>
            </View>
          )}
        </View>

        <View
          className={`flex-row gap-3 ${
            !dayData.enabled ? "opacity-40" : ""
          }`}
        >
          <View className="flex-1">
            <TimeInput
              key={`${day.key}-start`}
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
              key={`${day.key}-end`}
              label="End"
              value={dayData.endTime}
              onChange={(value) => updateDay(day.key, "endTime", value)}
              disabled={!dayData.enabled || saving}
              onWheelTouchStart={() => setParentScrollEnabled(false)}
              onWheelTouchEnd={() => setParentScrollEnabled(true)}
            />
          </View>
        </View>
      </>
    );

    if (!dayData.enabled) {
      return (
        <Pressable
          onPress={() => toggleDay(day.key)}
          disabled={saving}
          className="mb-5 rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
        >
          {dayContent}
        </Pressable>
      );
    }

    return (
      <View className="mb-5 rounded-2xl border border-app-border bg-app-surface p-4">
        {dayContent}
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">
          Loading availability...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <FlatList
          data={[selectedDay]}
          keyExtractor={(item) => item.key}
          renderItem={renderDay}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-6"
          scrollEnabled={parentScrollEnabled}

          ListHeaderComponent={
            <View>
              <View className="px-1 py-6">
                <View className="flex-row items-center">
                  <Pressable
                    onPress={() => router.back()}
                    disabled={saving}
                    className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
                  >
                    <Ionicons name="arrow-back" size={24} color="#1677FF" />
                  </Pressable>

                  <Text className="flex-1 text-center text-3xl font-bold text-app-text">
                    Avail<Text className="text-app-primary">ability</Text>
                  </Text>

                  <View className="h-11 w-11" />
                </View>
              </View>

              <View className="mb-5 flex-row justify-between">
                {DAYS.map((day) => {
                  const selected = day.key === selectedDayKey;

                  return (
                    <Pressable
                      key={day.key}
                      onPress={() => handleSelectDay(day.key)}
                      disabled={saving}
                      className={`h-11 w-11 items-center justify-center rounded-full ${
                        selected
                          ? "bg-app-primary"
                          : "bg-app-surface-elevated active:bg-app-primary-soft"
                      }`}
                    >
                      <Text
                        className={`text-sm font-bold ${
                          selected
                            ? "text-app-text-inverse"
                            : "text-app-text-secondary"
                        }`}
                      >
                        {day.shortLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          }
          ListFooterComponent={
            <View>
              <Pressable
                onPress={handleSave}
                disabled={saving}
                className={`rounded-2xl px-4 py-4 ${
                  saving ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
                }`}
              >
                <Text className="text-center text-base font-bold text-app-text-inverse">
                  {saving ? "Saving..." : "Save Availability"}
                </Text>
              </Pressable>

              <Pressable
                onPress={handleCancel}
                disabled={saving}
                className="mb-10 mt-4 rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
              >
                <Text className="text-center text-base font-bold text-app-text">
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
