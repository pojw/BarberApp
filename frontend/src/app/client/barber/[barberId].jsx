import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { db } from "../../../config/firebase";

const DAY_KEYS = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

function formatTime12Hour(time24) {
  if (!time24 || !time24.includes(":")) {
    return "Not available";
  }

  const [hourString, minute] = time24.split(":");
  const hour24 = Number(hourString);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}

function getUpcomingDays(numberOfDays = 7) {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date();

    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + index);

    return {
      id: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
        2,
        "0"
      )}-${String(date.getDate()).padStart(2, "0")}`,
      date,
      dayKey: DAY_KEYS[date.getDay()],
      dayName: date.toLocaleDateString("en-US", {
        weekday: "short",
      }),
      monthDay: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    };
  });
}

export default function BarberDetails() {
  const router = useRouter();
  const { barberId } = useLocalSearchParams();

  const [barberData, setBarberData] = useState(null);
  const [userData, setUserData] = useState(null);

  const [selectedServiceIds, setSelectedServiceIds] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadBarberDetails() {
      try {
        if (!barberId || Array.isArray(barberId)) {
          setErrorMessage("A valid barber ID was not provided.");
          return;
        }

        const barberRef = doc(db, "barbers", barberId);
        const userRef = doc(db, "users", barberId);

        const [barberSnap, userSnap] = await Promise.all([
          getDoc(barberRef),
          getDoc(userRef),
        ]);

        if (!barberSnap.exists()) {
          setErrorMessage("This barber profile could not be found.");
          return;
        }

        const loadedBarber = {
          id: barberSnap.id,
          ...barberSnap.data(),
        };

        setBarberData(loadedBarber);
        console.log("Loaded barber:", loadedBarber);

        if (userSnap.exists()) {
          setUserData(userSnap.data());
        }
      } catch (error) {
        console.log("Load barber details error:", error);
        setErrorMessage("Failed to load barber details.");
      } finally {
        setLoading(false);
      }
    }

    loadBarberDetails();
  }, [barberId]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-gray-500">
          Loading barber details...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !barberData) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-2xl font-bold text-black">
          Barber Not Found
        </Text>

        <Text className="mt-3 text-center text-base text-gray-500">
          {errorMessage || "The barber profile could not be loaded."}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-8 rounded-2xl bg-black px-6 py-4"
        >
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const services = Array.isArray(barberData.services)
    ? barberData.services
    : [];

  const selectedServices = services.filter((service, index) => {
    const serviceId = service.id || String(index);
    return selectedServiceIds.includes(serviceId);
  });

  const totalDuration = selectedServices.reduce(
    (total, service) =>
      total + Number(service.durationMinutes || 0),
    0
  );

  const totalPrice = selectedServices.reduce(
    (total, service) => total + Number(service.price || 0),
    0
  );

  const hasSelectedServices = selectedServices.length > 0;

  const upcomingDays = getUpcomingDays(7);

  const selectedDay = upcomingDays.find(
    (day) => day.id === selectedDate
  );

  const selectedDayAvailability = selectedDay
    ? barberData.availability?.[selectedDay.dayKey]
    : null;

  function toggleService(serviceId) {
    setSelectedServiceIds((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId);
      }

      return [...current, serviceId];
    });

    setSelectedDate(null);
    setSelectedTime(null);
  }

  function handleDateSelection(day) {
    if (!hasSelectedServices) {
      return;
    }

    const dayAvailability =
      barberData.availability?.[day.dayKey];

    if (!dayAvailability?.enabled) {
      return;
    }

    setSelectedDate(day.id);

    // UI-only placeholder:
    // Use the barber's opening time as the earliest available time.
    setSelectedTime(dayAvailability.startTime);
  }

  function handleContinueBooking() {
    if (
      !hasSelectedServices ||
      !selectedDate ||
      !selectedTime
    ) {
      return;
    }

    Alert.alert(
      "Booking selection ready",
      `${selectedServices.length} service${
        selectedServices.length === 1 ? "" : "s"
      }, ${totalDuration} minutes, $${totalPrice.toFixed(2)}`
    );

    // Later, when the booking page exists:
    //
    // router.push({
    //   pathname: `/client/book/${barberData.id}`,
    //   params: {
    //     serviceIds: selectedServiceIds.join(","),
    //     date: selectedDate,
    //     time: selectedTime,
    //     durationMinutes: String(totalDuration),
    //     totalPrice: String(totalPrice),
    //   },
    // });
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <Pressable
          onPress={() => router.back()}
          className="mb-6 self-start rounded-xl bg-gray-100 px-4 py-3"
        >
          <Text className="font-bold text-black">
            Arrow Back
          </Text>
        </Pressable>

        {/* Barber Information */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black">
            {barberData.businessName ||
              userData?.fullName ||
              "Unnamed Barber"}
          </Text>

          {barberData.businessName && userData?.fullName ? (
            <Text className="mt-1 text-base text-gray-600">
              {userData.fullName}
            </Text>
          ) : null}

          <Text className="mt-3 text-base text-gray-500">
            {barberData.location?.city || "City not added"},{" "}
            {barberData.location?.state || "State not added"}
          </Text>

          <Text className="mt-2 font-semibold text-black">
            {barberData.rating ?? 0} rating ·{" "}
            {barberData.reviewCount ?? 0} reviews
          </Text>
        </View>

        {/* Services */}
        <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
          <Text className="mb-2 text-xl font-bold text-black">
            Services
          </Text>

          <Text className="mb-4 text-sm text-gray-500">
            Select one or more services.
          </Text>

          {services.length === 0 ? (
            <Text className="text-gray-500">
              No services are currently listed.
            </Text>
          ) : (
            services.map((service, index) => {
              const serviceId =
                service.id || String(index);

              const selected =
                selectedServiceIds.includes(serviceId);

              return (
                <Pressable
                  key={serviceId}
                  onPress={() => toggleService(serviceId)}
                  className={`mb-3 rounded-2xl border p-4 active:opacity-80 ${
                    selected
                      ? "border-black bg-gray-100"
                      : "border-gray-200 bg-white"
                  }`}
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-1 pr-4">
                      <Text className="text-base font-bold text-black">
                        {service.name || "Unnamed service"}
                      </Text>

                      <Text className="mt-1 text-sm text-gray-500">
                        {service.durationMinutes ?? 0} minutes
                      </Text>

                      {service.description ? (
                        <Text className="mt-2 text-sm leading-5 text-gray-600">
                          {service.description}
                        </Text>
                      ) : null}
                    </View>

                    <View className="items-end">
                      <Text className="font-bold text-black">
                        $
                        {Number(
                          service.price || 0
                        ).toFixed(2)}
                      </Text>

                      <View
                        className={`mt-3 h-6 w-6 items-center justify-center rounded-full border ${
                          selected
                            ? "border-black bg-black"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {selected ? (
                          <Text className="text-sm font-bold text-white">
                            ✓
                          </Text>
                        ) : null}
                      </View>
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>

        {/* Date and Time */}
        <View
          className={`mb-6 rounded-3xl border border-gray-200 bg-white p-5 ${
            hasSelectedServices
              ? "opacity-100"
              : "opacity-40"
          }`}
        >
          <Text className="text-xl font-bold text-black">
            Select Date and Time
          </Text>

          <Text className="mt-2 text-sm text-gray-500">
            {hasSelectedServices
              ? `${selectedServices.length} service${
                  selectedServices.length === 1 ? "" : "s"
                } selected · ${totalDuration} minutes`
              : "Select at least one service to view availability."}
          </Text>

          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            className="mt-5"
          >
            {upcomingDays.map((day) => {
              const dayAvailability =
                barberData.availability?.[day.dayKey];

              const barberIsOpen = Boolean(
                dayAvailability?.enabled
              );

              const enabled =
                hasSelectedServices && barberIsOpen;

              const selected =
                selectedDate === day.id;

              return (
                <Pressable
                  key={day.id}
                  disabled={!enabled}
                  onPress={() =>
                    handleDateSelection(day)
                  }
                  className={`mr-3 min-w-24 rounded-2xl border px-4 py-4 ${
                    selected
                      ? "border-black bg-black"
                      : enabled
                        ? "border-gray-300 bg-white"
                        : "border-gray-200 bg-gray-100"
                  }`}
                >
                  <Text
                    className={`text-center text-sm font-semibold ${
                      selected
                        ? "text-white"
                        : "text-gray-500"
                    }`}
                  >
                    {day.dayName}
                  </Text>

                  <Text
                    className={`mt-1 text-center text-base font-bold ${
                      selected
                        ? "text-white"
                        : "text-black"
                    }`}
                  >
                    {day.monthDay}
                  </Text>

                  <Text
                    className={`mt-2 text-center text-xs ${
                      selected
                        ? "text-gray-200"
                        : "text-gray-500"
                    }`}
                  >
                    {barberIsOpen
                      ? formatTime12Hour(
                          dayAvailability.startTime
                        )
                      : "Closed"}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <View className="mt-5 rounded-2xl bg-gray-50 p-4">
            <Text className="text-sm font-semibold text-gray-500">
              Earliest available time
            </Text>

            <Text className="mt-2 text-xl font-bold text-black">
              {selectedTime
                ? formatTime12Hour(selectedTime)
                : "Select an available day"}
            </Text>

            {selectedDayAvailability?.enabled ? (
              <Text className="mt-1 text-sm text-gray-500">
                Barber hours:{" "}
                {formatTime12Hour(
                  selectedDayAvailability.startTime
                )}{" "}
                –{" "}
                {formatTime12Hour(
                  selectedDayAvailability.endTime
                )}
              </Text>
            ) : null}
          </View>
        </View>

          <Pressable
          onPress={handleContinueBooking}
          disabled={
            !hasSelectedServices ||
            !selectedDate ||
            !selectedTime
          }
          className={`mb-10 rounded-2xl px-4 py-4 active:opacity-80 ${
            hasSelectedServices &&
            selectedDate &&
            selectedTime
              ? "bg-black"
              : "bg-gray-400"
          }`}
        >
          <Text className="text-center text-base font-bold text-white">
           Book Appointment
          </Text>
        </Pressable>  

        
     
      </ScrollView>
    </SafeAreaView>
  );
}