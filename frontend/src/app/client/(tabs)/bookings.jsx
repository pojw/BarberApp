import { useCallback, useState } from "react";
import {
  View,
  Alert,
  Pressable,
  Text,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { getReviewForBooking,createReview } from "../../../services/reviewService";

const BOOKINGS_CACHE_KEY_PREFIX = "clientBookingsCache";

function getBookingsCacheKey(uid) {
  return `${BOOKINGS_CACHE_KEY_PREFIX}:${uid}`;
}
export default function ClientBookings() {
  const [bookings, setBookings] = useState([]);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);

const [errorMessage, setErrorMessage] = useState("");

const [reviewModalVisible, setReviewModalVisible] = useState(false);
const [selectedBooking, setSelectedBooking] = useState(null);
const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [submittingReview, setSubmittingReview] = useState(false);

function openReviewModal(booking) {
  setSelectedBooking(booking);
  setRating(0);
  setComment("");
  setReviewModalVisible(true);
}

function closeReviewModal() {
  setReviewModalVisible(false);
  setSelectedBooking(null);
  setRating(0);
  setComment("");
  setSubmittingReview(false);
}
async function handleSubmitReview() {
  try {
    if (!selectedBooking) {
      Alert.alert("Missing booking", "Could not find the booking to review.");
      return;
    }

    if (!rating) {
      Alert.alert("Rating required", "Please select a rating from 1 to 5.");
      return;
    }

    setSubmittingReview(true);

    await createReview({
      booking: selectedBooking,
      rating,
      comment,
    });

    await loadClientBookings();

    closeReviewModal();

    Alert.alert("Review submitted", "Thank you for leaving a review.");
  } catch (error) {
    console.log("Submit review error:", error);

    Alert.alert(
      "Review failed",
      error.message || "Could not submit your review."
    );
  } finally {
    setSubmittingReview(false);
  }
}

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
              currentUser.uid
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

async function loadCachedBookings(uid) {
  try {
    const cachedBookings = await AsyncStorage.getItem(
      getBookingsCacheKey(uid)
    );

    if (!cachedBookings) {
      return false;
    }

    const parsedCache = JSON.parse(cachedBookings);

    if (Array.isArray(parsedCache.bookings)) {
      setBookings(parsedCache.bookings);
      return true;
    }

    return false;
  } catch (error) {
    console.log("Load cached bookings error:", error);
    return false;
  }
}

async function saveBookingsCache({
  uid,
  loadedBookings,
}) {
  try {
    await AsyncStorage.setItem(
      getBookingsCacheKey(uid),
      JSON.stringify({
        bookings: loadedBookings,
        cachedAt: Date.now(),
      })
    );
  } catch (error) {
    console.log("Save bookings cache error:", error);
  }
}

async function loadClientBookings({
  showLoader = true,
  useCache = false,
  showErrorOnFailure = true,
} = {}) {
  let hasCachedData = false;

  try {
    if (showLoader) {
      setLoading(true);
    }
    setErrorMessage("");

    const currentUser = auth.currentUser;
console.log("Current user uid:", currentUser?.uid);
    if (!currentUser) {
      setErrorMessage("You must be logged in to view bookings.");
      return;
    }

    if (useCache) {
      hasCachedData = await loadCachedBookings(currentUser.uid);

      if (hasCachedData) {
        setLoading(false);
      }
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

const bookingsWithReviews = await Promise.all(
  sortedBookings.map(async (booking) => {
    if (booking.status !== "completed") {
      return {
        ...booking,
        review: null,
      };
    }

    const review = await getReviewForBooking(booking.id);

    return {
      ...booking,
      review,
    };
  })
);
console.log("Bookings with reviews:", bookingsWithReviews);
setBookings(bookingsWithReviews);
await saveBookingsCache({
  uid: currentUser.uid,
  loadedBookings: bookingsWithReviews,
});
} catch (error) {
    console.log("Load client bookings error:", error);
    if (showErrorOnFailure && !hasCachedData) {
      setErrorMessage("Could not load your bookings.");
    }
  } finally {
    setLoading(false);
  }
}
useFocusEffect(
  useCallback(() => {
    loadClientBookings({
      showLoader: true,
      useCache: true,
    });
  }, [])
);

const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadClientBookings({
    showLoader: false,
    showErrorOnFailure: false,
  });
  setRefreshing(false);
}, []);

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
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#1677FF"
          colors={["#1677FF"]}
        />
      }
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
{item.status === "completed" && (
  <View className="mt-4">
    {item.review ? (
      <View className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
        <Text className="text-center text-sm font-bold text-green-700">
          Review submitted
        </Text>
      </View>
    ) : (
     <Pressable
  onPress={() => openReviewModal(item)}
  className="rounded-xl bg-black px-4 py-3 active:opacity-80"
>
  <Text className="text-center text-sm font-bold text-white">
    Leave Review
  </Text>
</Pressable>
    )}
  </View>
)}
           
          </View>
        );
      }}
    />
<Modal
  visible={reviewModalVisible}
  transparent
  animationType="fade"
  onRequestClose={closeReviewModal}
>
  <View
    className="flex-1 items-center justify-center px-6"
    style={{ backgroundColor: "rgba(0,0,0,0.4)" }}
  >
    <View className="w-full rounded-3xl bg-white px-6 py-6">
      <Text className="text-2xl font-bold text-black">
        Leave a Review
      </Text>

      <Text className="mt-2 text-sm text-gray-500">
        {selectedBooking?.businessName ||
          selectedBooking?.barberName ||
          "Your barber"}
      </Text>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-bold text-black">
          Rating
        </Text>

        <View className="flex-row justify-between">
          {[1, 2, 3, 4, 5].map((value) => {
            const isSelected = rating === value;

            return (
              <Pressable
                key={value}
                style={{ outlineStyle: "none" }}
                onPress={() => setRating(value)}
       className={
  isSelected
    ? "h-14 w-14 items-center justify-center rounded-full bg-black"
    : "h-14 w-14 items-center justify-center rounded-full border border-gray-300 bg-white"
}
              >
                <Text
                  className={
                    isSelected
                      ? "text-base font-bold text-white"
                      : "text-base font-bold text-black"
                  }
                >
                  {value}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="mt-6">
        <Text className="mb-3 text-sm font-bold text-black">
          Comment
        </Text>

        <TextInput
          value={comment}
          onChangeText={setComment}
          placeholder="How was your appointment?"
          multiline
          textAlignVertical="top"
          className="min-h-28 rounded-2xl border border-gray-300 px-4 py-3 text-base text-black"
        />
      </View>

      <View className="mt-6 flex-row gap-3">
        <Pressable
          onPress={closeReviewModal}
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 active:opacity-80"
        >
          <Text className="text-center font-bold text-black">
            Cancel
          </Text>
        </Pressable>

        <Pressable
  onPress={handleSubmitReview}
  disabled={submittingReview}
  style={{ outlineStyle: "none" }}
  className={
    submittingReview
      ? "flex-1 rounded-xl bg-gray-400 px-4 py-3"
      : "flex-1 rounded-xl bg-black px-4 py-3 active:opacity-80"
  }
>
  <Text className="text-center font-bold text-white">
    {submittingReview ? "Submitting..." : "Submit"}
  </Text>
</Pressable>
      </View>
    </View>
  </View>
</Modal>
  </SafeAreaView>
);
}
