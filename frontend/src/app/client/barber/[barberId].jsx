import { useEffect, useState } from "react";
import {
  View,
  Text,Image,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import {auth, db } from "../../../config/firebase";

//Booking functions
import { generateBookingSlots } from "../../../utils/generateBookingSlots";
import { filterAvailableSlots } from "../../../utils/filterAvailableSlots";
import { getBarberBookingsByDate } from "../../../services/bookingService";
import { createBooking } from "../../../services/createBooking";


//Messages 
import { getOrCreateConversation } from "../../../services/messageService";


import { getReviewsForBarber } from "../../../services/reviewService";

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


  const [availableSlots, setAvailableSlots] = useState([]);
const [loadingSlots, setLoadingSlots] = useState(false);

const [clientUserData, setClientUserData] = useState(null);
const [savingBooking, setSavingBooking] = useState(false);
const currentUser = auth.currentUser;

const [reviews, setReviews] = useState([]);
const [reviewsLoading, setReviewsLoading] = useState(false);
const [selectedTab, setSelectedTab] = useState("services");
//Messsages 
const [messageLoading, setMessageLoading] = useState(false);


  useEffect(() => {
    async function loadBarberDetails() {
      try {
        if (!barberId || Array.isArray(barberId)) {
          setErrorMessage("A valid barber ID was not provided.");
          return;
        }

        const barberRef = doc(db, "barbers", barberId);
        const userRef = doc(db, "users", barberId);
        const clientUserRef = doc(db, "users", currentUser.uid);

        const [barberSnap, userSnap,clientUserSnap] = await Promise.all([
          getDoc(barberRef),
          getDoc(userRef),
          getDoc(clientUserRef),

        ]);
        if (clientUserSnap.exists()) {
          setClientUserData(clientUserSnap.data());
        }
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
       await loadBarberReviews(barberId);

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


async function handleMessageBarber() {
  try {
    setMessageLoading(true);

    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Login required", "You must be logged in to message a barber.");
      return;
    }

    if (!barberId || Array.isArray(barberId)) {
      Alert.alert("Missing barber", "Missing barber information.");
      return;
    }

    const conversation = await getOrCreateConversation({
      clientId: currentUser.uid,
      barberId,
      clientName:
        clientUserData?.fullName ||
        currentUser.displayName ||
        "Client",
      barberName:
        userData?.fullName ||
        barberData?.fullName ||
        barberData?.name ||
        "Barber",
      businessName: barberData?.businessName || "",
      barberProfileImageUrl:
        barberData?.profileImageUrl ||
        userData?.profileImageUrl ||
        "",
    });

    router.push(`/client/conversation/${conversation.id}`);
  } catch (error) {
    console.error("Error opening conversation:", error);
    Alert.alert("Message error", "Could not open conversation. Please try again.");
  } finally {
    setMessageLoading(false);
  }
}

async function loadBarberReviews(currentBarberId) {
  try {
    if (!currentBarberId) {
      setReviews([]);
      return;
    }

    setReviewsLoading(true);

    const reviewList = await getReviewsForBarber(currentBarberId);

    setReviews(reviewList);
  } catch (error) {
    console.log("Load barber reviews error:", error);
    setReviews([]);
  } finally {
    setReviewsLoading(false);
  }
}

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
    setAvailableSlots([]);
  }

async function handleDateSelection(day) {
  if (!hasSelectedServices) {
    return;
  }

  const dayAvailability = barberData.availability?.[day.dayKey];

  if (!dayAvailability?.enabled) {
    return;
  }

  try {
    setLoadingSlots(true);
    setSelectedDate(day.id);
    setSelectedTime(null);
    setAvailableSlots([]);

    const candidateSlots = generateBookingSlots(
      dayAvailability.startTime,
      dayAvailability.endTime,
      totalDuration
    );

    const existingBookings = await getBarberBookingsByDate(
      barberData.id,
      day.id
    );

    const validSlots = filterAvailableSlots(
      candidateSlots,
      existingBookings
    );

    setAvailableSlots(validSlots);
  } catch (error) {
    console.log("Load available slots error:", error);
    Alert.alert(
      "Availability error",
      "Could not load available appointment times."
    );
  } finally {
    setLoadingSlots(false);
  }
}

 function handleBookPress() {
  if (!hasSelectedServices || !selectedDate || !selectedTime) {
    Alert.alert(
      "Missing selection",
      "Please select at least one service, a date, and a time."
    );
    return;
  }

  const selectedSlot = availableSlots.find(
    (slot) => slot.startTime === selectedTime
  );

  if (!selectedSlot) {
    Alert.alert(
      "Time unavailable",
      "Please select an available appointment time."
    );
    return;
  }

  Alert.alert(
    "Confirm Booking",
    `Book ${selectedServices.length} service${
      selectedServices.length === 1 ? "" : "s"
    } on ${selectedDate} at ${formatTime12Hour(selectedTime)}?`,
    [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
  text: "Confirm",
  onPress: async () => {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        Alert.alert(
          "Login required",
          "You must be logged in to create a booking."
        );
        return;
      }

      const selectedSlot = availableSlots.find(
        (slot) => slot.startTime === selectedTime
      );

      if (!selectedSlot) {
        Alert.alert(
          "Time unavailable",
          "Please select an available appointment time."
        );
        return;
      }

      setSavingBooking(true);

      const bookingServices = selectedServices.map((service, index) => ({
        id: service.id || String(index),
        name: service.name || "Unnamed service",
        price: Number(service.price || 0),
        durationMinutes: Number(service.durationMinutes || 0),
      }));

      const bookingId = await createBooking({
        clientId: currentUser.uid,
        barberId: barberData.id,

        clientName:
          clientUserData?.fullName || "Unnamed client",

        barberName:
          userData?.fullName || "Unnamed barber",

        businessName:
          barberData.businessName || "Unnamed business",

        services: bookingServices,

        totalPrice,
        totalDurationMinutes: totalDuration,

        appointmentDate: selectedDate,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,

        clientNotes: "",
      });

      Alert.alert(
        "Booking requested",
        "Your appointment request was sent to the barber.",
        [
          {
            text: "OK",
            onPress: () => router.replace("/client/bookings"),
          },
        ]
      );

      console.log("Created booking:", bookingId);
    } catch (error) {
      console.log("Create booking error:", error);

      Alert.alert(
        "Booking failed",
        error.message || "Could not create the booking."
      );
    } finally {
      setSavingBooking(false);
    }
  },
}
    ]
  );
}
const portfolioImages = Array.isArray(
  barberData.portfolioImages
)
  ? barberData.portfolioImages
  : [];  return (
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
            <View className="items-center mb-6">
            {barberData.profileImageUrl ? (
  <Image
    source={{ uri: barberData.profileImageUrl }}
    className="w-28 h-28 rounded-full"
  />
) : (
  <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center">
    <Text className="text-gray-500">
      No Photo
    </Text>
  </View>
)}
          </View>
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

        <View className="mb-6 flex-row rounded-2xl bg-gray-100 p-1">
  <Pressable
    onPress={() => setSelectedTab("services")}
    className={
      selectedTab === "services"
        ? "flex-1 rounded-xl bg-white px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "services"
          ? "text-center font-bold text-black"
          : "text-center font-bold text-gray-500"
      }
    >
      Services
    </Text>
  </Pressable>

  <Pressable
    onPress={() => setSelectedTab("reviews")}
    className={
      selectedTab === "reviews"
        ? "flex-1 rounded-xl bg-white px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "reviews"
          ? "text-center font-bold text-black"
          : "text-center font-bold text-gray-500"
      }
    >
      Reviews
    </Text>
  </Pressable>
   <Pressable
    onPress={() => setSelectedTab("portfolio")}
    className={
      selectedTab === "portfolio"
        ? "flex-1 rounded-xl bg-white px-4 py-3"
        : "flex-1 rounded-xl px-4 py-3"
    }
  >
    <Text
      className={
        selectedTab === "portfolio"
          ? "text-center font-bold text-black"
          : "text-center font-bold text-gray-500"
      }
    >
      Portfolio
    </Text>
  </Pressable>
</View>
{selectedTab === "services" && (
  <>

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
    Available times
  </Text>

  {loadingSlots ? (
    <ActivityIndicator className="mt-4" />
  ) : !selectedDate ? (
    <Text className="mt-3 text-gray-500">
      Select an available day.
    </Text>
  ) : availableSlots.length === 0 ? (
    <Text className="mt-3 text-gray-500">
      No appointment times are available for this day.
    </Text>
  ) : (
    <View className="mt-4 flex-row flex-wrap gap-2">
      {availableSlots.map((slot) => {
        const selected = selectedTime === slot.startTime;

        return (
          <Pressable
            key={`${slot.startTime}-${slot.endTime}`}
            onPress={() => setSelectedTime(slot.startTime)}
            className={`rounded-xl border px-4 py-3 ${
              selected
                ? "border-black bg-black"
                : "border-gray-300 bg-white"
            }`}
          >
            <Text
              className={`font-semibold ${
                selected ? "text-white" : "text-black"
              }`}
            >
              {formatTime12Hour(slot.startTime)}
            </Text>
          </Pressable>
        );
      })}
    </View>
  )}
</View>
        </View>

<Pressable
  disabled={
    savingBooking ||
    !hasSelectedServices ||
    !selectedDate ||
    !selectedTime
  }
  onPress={handleBookPress}
  className={`rounded-2xl px-4 py-4 active:opacity-80 ${
    savingBooking ||
    !hasSelectedServices ||
    !selectedDate ||
    !selectedTime
      ? "bg-gray-300"
      : "bg-black"
  }`}
>
  <Text className="text-center text-base font-bold text-white">
    {savingBooking ? "Booking..." : "Book Appointment"}
  </Text>
</Pressable>
<Pressable
  onPress={handleMessageBarber}
  disabled={messageLoading}
  style={{
    backgroundColor: messageLoading ? "#d1d5db" : "#000000",
  }}
  className="mt-4 rounded-2xl px-4 py-4 active:opacity-80"
>
  <Text className="text-center text-base font-bold text-white">
    {messageLoading ? "Opening Chat..." : "Message Barber"}
  </Text>
</Pressable>
    </>
)}

{/* reviews */}
{selectedTab === "reviews" && (
  <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
    <View className="flex-row items-center justify-between">
      <Text className="text-xl font-bold text-black">
        Reviews
      </Text>

      <Text className="text-sm font-semibold text-gray-500">
        {Number(barberData?.rating || 0).toFixed(1)} ⭐ (
        {barberData?.reviewCount || 0})
      </Text>
    </View>

    {reviewsLoading ? (
      <View className="mt-6">
        <ActivityIndicator />
        <Text className="mt-3 text-center text-gray-500">
          Loading reviews...
        </Text>
      </View>
    ) : reviews.length === 0 ? (
      <Text className="mt-5 text-gray-500">
        No reviews yet.
      </Text>
    ) : (
      <View className="mt-5">
        {reviews.map((review) => (
          <View
            key={review.id}
            className="mb-4 rounded-2xl border border-gray-100 bg-gray-50 p-4"
          >
            <View className="flex-row items-center justify-between">
              <Text className="font-bold text-black">
                {review.clientName || "Client"}
              </Text>

              <Text className="font-bold text-black">
                {review.rating} ⭐
              </Text>
            </View>

            {!!review.comment && (
              <Text className="mt-3 leading-5 text-gray-700">
                {review.comment}
              </Text>
            )}

            <Text className="mt-3 text-xs text-gray-400">
              {review.createdAt?.toDate
                ? review.createdAt.toDate().toLocaleDateString()
                : ""}
            </Text>
          </View>
        ))}
      </View>
    )}
  </View>
)}
{selectedTab === "portfolio" && (
  <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
    <Text className="text-xl font-bold text-black">
      Portfolio
    </Text>

    {portfolioImages.length === 0 ? (
      <Text className="mt-5 text-gray-500">
        No portfolio images yet.
      </Text>
    ) : (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="mt-4"
      >
        {portfolioImages.map((image) => (
          <Image
            key={image.id}
            source={{ uri: image.url }}
            className="mr-3 h-28 w-28 rounded-xl"
            resizeMode="cover"
          />
        ))}
      </ScrollView>
    )}
  </View>
)}
        
      </ScrollView>

    </SafeAreaView>
  );
}
