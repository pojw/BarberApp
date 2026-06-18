import { useCallback, useState } from "react";
import {
  View,
  Alert,
  Pressable,
  Text,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { formatTime12Hour } from "../../../utils/bookingTime";
import { auth, db } from "../../../config/firebase";
import { useFocusEffect } from "expo-router";
import { cancelBooking } from "../../../services/bookingService";
export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);

const [errorMessage, setErrorMessage] = useState("");
function handleCancelBooking(booking) {
  const canCancel =
    booking.status === "pending" ||
    booking.status === "confirmed";

  if (!canCancel) {
    Alert.alert(
      "Cannot cancel",
      "Only pending or confirmed bookings can be cancelled."
    );
    return;
  }

  Alert.alert(
    "Cancel Booking",
    "Are you sure you want to cancel this appointment?",
    [
      {
        text: "Keep Booking",
        style: "cancel",
      },
      {
        text: "Cancel Appointment",
        style: "destructive",
        onPress: async () => {
          try {
            const currentUser = auth.currentUser;

            if (!currentUser) {
              Alert.alert(
                "Login required",
                "You must be logged in to cancel a booking."
              );
              return;
            }

            if (booking.clientId !== currentUser.uid) {
              Alert.alert(
                "Not allowed",
                "You cannot cancel this booking."
              );
              return;
            }

            await cancelBooking(
              booking.id,
            );

            await loadClientBookings();

            Alert.alert(
              "Booking cancelled",
              "Your appointment has been cancelled."
            );
          } catch (error) {
            console.log("Cancel booking error:", error);

            Alert.alert(
              "Cancellation failed",
              error.message || "Could not cancel the booking."
            );
          }
        },
      },
    ]
  );
}

async function loadClientBookings() {
  try {
    setLoading(true);
    setErrorMessage("");

    const currentUser = auth.currentUser;

    if (!currentUser) {
      setErrorMessage("You must be logged in to view bookings.");
      return;
    }

    const bookingsRef = collection(db, "bookings");

    const bookingsQuery = query(
      bookingsRef,
      where("clientId", "==", currentUser.uid)
    );

    const bookingsSnapshot = await getDocs(bookingsQuery);

    const bookingList = bookingsSnapshot.docs.map((bookingDoc) => ({
      id: bookingDoc.id,
      ...bookingDoc.data(),
    }));

const sortedBookings = bookingList.sort((a, b) => {
  const dateA = `${a.appointmentDate || ""} ${a.startTime || ""}`;
  const dateB = `${b.appointmentDate || ""} ${b.startTime || ""}`;

  return dateA.localeCompare(dateB);
});

setBookings(sortedBookings);  } catch (error) {
    console.log("Load client bookings error:", error);
    setErrorMessage("Could not load your bookings.");
  } finally {
    setLoading(false);
  }
}
useFocusEffect(
  useCallback(() => {
    loadClientBookings();
  }, [])
);

if (loading) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator size="large" />
      <Text className="mt-4 text-gray-500">
        Loading bookings...
      </Text>
    </SafeAreaView>
  );
}

if (errorMessage) {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
      <Text className="text-center text-2xl font-bold text-black">
        Booking Error
      </Text>

      <Text className="mt-3 text-center text-gray-500">
        {errorMessage}
      </Text>
    </SafeAreaView>
  );
}

return (
  <SafeAreaView className="flex-1 bg-white">
    <FlatList
      data={bookings}
      keyExtractor={(item) => item.id}
      contentContainerClassName="px-6 py-6"
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View className="mb-6">
          <Text className="text-3xl font-bold text-black">
            My Bookings
          </Text>

          <Text className="mt-2 text-base text-gray-500">
            View your upcoming and previous appointments.
          </Text>
        </View>
      }
      ListEmptyComponent={
        <View className="rounded-3xl border border-gray-200 bg-white p-6">
          <Text className="text-center text-base text-gray-500">
            You do not have any bookings yet.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const services = Array.isArray(item.services)
          ? item.services
          : [];

        return (
          <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-5">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text className="text-xl font-bold text-black">
                  {item.businessName || item.barberName || "Barber"}
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  {item.appointmentDate || "Date not set"}
                </Text>

                <Text className="mt-1 text-sm text-gray-500">
                  {formatTime12Hour(item.startTime)} –{" "}
                  {formatTime12Hour(item.endTime)}
                </Text>
              </View>

              <View className="rounded-full bg-gray-100 px-3 py-2">
                <Text className="text-sm font-bold capitalize text-black">
                  {item.status || "pending"}
                </Text>
                
              </View>
              
            </View>

            <View className="my-4 h-px bg-gray-200" />

            <Text className="mb-2 text-sm font-semibold text-gray-500">
              Services
            </Text>

            {services.length === 0 ? (
              <Text className="text-gray-500">
                No services listed.
              </Text>
            ) : (
              services.map((service, index) => (
                <View
                  key={service.id || String(index)}
                  className="mb-2 flex-row justify-between"
                >
                  <Text className="flex-1 pr-4 text-gray-700">
                    {service.name || "Unnamed service"}
                  </Text>

                  <Text className="font-semibold text-black">
                    ${Number(service.price || 0).toFixed(2)}
                  </Text>
                </View>
              ))
            )}

            <View className="mt-4 flex-row justify-between">
              <Text className="font-semibold text-gray-600">
                Duration
              </Text>

              <Text className="font-bold text-black">
                {item.totalDurationMinutes || 0} minutes
              </Text>
            </View>

            <View className="mt-2 flex-row justify-between">
  <Text className="font-semibold text-gray-600">
    Total
  </Text>

  <Text className="text-lg font-bold text-black">
    ${Number(item.totalPrice || 0).toFixed(2)}
  </Text>
</View>

{(item.status === "pending" ||
  item.status === "confirmed") && (
  <View className="mt-4 flex-row justify-center">
    <Pressable
      onPress={() => handleCancelBooking(item)}
      className=" rounded-lg border border-red-300 bg-red-50 px-6 py-2 active:opacity-80"
    >
      <Text className="text-xs font-bold text-red-600">
        Cancel
      </Text>
    </Pressable>
  </View>
)}
           
          </View>
        );
      }}
    />
  </SafeAreaView>
);
}