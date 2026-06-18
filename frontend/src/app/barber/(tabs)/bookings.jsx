import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
  ScrollView,
    TextInput,

} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { auth } from "../../../config/firebase";
import {
  cancelBooking,
  completeBooking,
  confirmBooking,
  getBookingsForBarber,
} from "../../../services/bookingService";
import { formatTime12Hour } from "../../../utils/bookingTime";

export default function BarberBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);
const [dateFilter, setDateFilter] = useState("all");
const [statusFilter, setStatusFilter] = useState("all");
const [selectedDate, setSelectedDate] = useState("");
function getTodayDateString() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}
const filteredBookings = bookings.filter((booking) => {
  const today = getTodayDateString();

  const matchesDateFilter =
    dateFilter === "all" ||
    (dateFilter === "today" && booking.appointmentDate === today) ||
    (dateFilter === "upcoming" && booking.appointmentDate >= today) ||
    (dateFilter === "specific" &&
      selectedDate &&
      booking.appointmentDate === selectedDate);

  const matchesStatusFilter =
    statusFilter === "all" || booking.status === statusFilter;

  return matchesDateFilter && matchesStatusFilter;
});
  function getStatusStyle(status) {
    if (status === "pending") {
      return "bg-yellow-100 text-yellow-700";
    }

    if (status === "confirmed") {
      return "bg-green-100 text-green-700";
    }

    if (status === "completed") {
      return "bg-blue-100 text-blue-700";
    }

    if (status === "cancelled") {
      return "bg-red-100 text-red-700";
    }

    return "bg-gray-100 text-gray-700";
  }

function renderActionButton(
  label,
  onPress,
  variant = "primary",
  disabled = false
) {
  let backgroundColor = "#16a34a"; // green

  if (variant === "danger") {
    backgroundColor = "#dc2626"; // red
  }

  if (variant === "secondary") {
    backgroundColor = "#111827"; // dark gray
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={{
        backgroundColor,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        opacity: disabled ? 0.5 : 1,
        minWidth: 90,
        alignItems: "center",
      }}
    >
      <Text
        style={{
          color: "white",
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
function renderFilterChip(label, isActive, onPress) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 999,
        backgroundColor: isActive ? "#111827" : "#f3f4f6",
        marginRight: 8,
      }}
    >
      <Text
        style={{
          color: isActive ? "white" : "#374151",
          fontSize: 13,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

  async function loadBookings() {
    try {
      setLoading(true);
      setErrorMessage("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        throw new Error("You must be logged in to view bookings.");
      }

      const barberBookings = await getBookingsForBarber(currentUser.uid);

const sortedBookings = barberBookings.sort((a, b) => {
  const dateA = `${a.appointmentDate || ""} ${a.startTime || ""}`;
  const dateB = `${b.appointmentDate || ""} ${b.startTime || ""}`;

  return dateA.localeCompare(dateB);
});

setBookings(sortedBookings);    } catch (error) {
      console.log("Error loading barber bookings:", error);
      setErrorMessage("Could not load bookings. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusAction(bookingId, actionType) {
    try {
      setActionLoadingId(bookingId);

      if (actionType === "confirm") {
        await confirmBooking(bookingId);
      }

      if (actionType === "cancel") {
        await cancelBooking(bookingId);
      }

      if (actionType === "complete") {
        await completeBooking(bookingId);
      }

      await loadBookings();
    } catch (error) {
      console.log("Error updating booking status:", error);
      setErrorMessage("Could not update booking. Please try again.");
    } finally {
      setActionLoadingId(null);
    }
  }

  useFocusEffect(
    useCallback(() => {
      loadBookings();
    }, [])
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-500">
          Loading bookings...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-red-500 text-center font-semibold">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  

  return (
    <SafeAreaView className="flex-1 bg-white">
    <View style={{
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  }}>
  <Text className="text-2xl font-bold text-gray-900">
    Bookings
  </Text>
  <Text className="mt-1 text-gray-500">
    Manage your client appointments.
  </Text>

  <Text className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
    Date
  </Text>


<ScrollView
  horizontal
  showsHorizontalScrollIndicator={false}
>
  {renderFilterChip("All", dateFilter === "all", () => {
    setDateFilter("all");
    setSelectedDate("");
  })}

  {renderFilterChip("Today", dateFilter === "today", () => {
    setDateFilter("today");
    setSelectedDate("");
  })}

  {renderFilterChip("Upcoming", dateFilter === "upcoming", () => {
    setDateFilter("upcoming");
    setSelectedDate("");
  })}

  {renderFilterChip("Specific Date", dateFilter === "specific", () => {
    setDateFilter("specific");
  })}
</ScrollView>

{dateFilter === "specific" && (
  <View
    style={{
      marginTop: 12,
    }}
  >
    <TextInput
      value={selectedDate}
      onChangeText={setSelectedDate}
      placeholder="Enter date: YYYY-MM-DD"
      autoCapitalize="none"
      keyboardType="numbers-and-punctuation"
      style={{
        borderWidth: 1,
        borderColor: "#d1d5db",
        borderRadius: 12,
        paddingHorizontal: 14,
        paddingVertical: 10,
        fontSize: 14,
        color: "#111827",
      }}
    />

    <Text
      style={{
        marginTop: 6,
        fontSize: 12,
        color: "#6b7280",
      }}
    >
      Example: 2026-06-20
    </Text>
  </View>
)}
  <Text className="mt-5 mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">
    Status
  </Text>

  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
  >
    {renderFilterChip("All", statusFilter === "all", () => {
      setStatusFilter("all");
    })}

    {renderFilterChip("Pending", statusFilter === "pending", () => {
      setStatusFilter("pending");
    })}

    {renderFilterChip("Confirmed", statusFilter === "confirmed", () => {
      setStatusFilter("confirmed");
    })}

    {renderFilterChip("Completed", statusFilter === "completed", () => {
      setStatusFilter("completed");
    })}

    {renderFilterChip("Cancelled", statusFilter === "cancelled", () => {
      setStatusFilter("cancelled");
    })}
  </ScrollView>
</View>

      <FlatList
        data={filteredBookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: 24,
        }}
      ListEmptyComponent={
  <View className="items-center justify-center py-12">
    <Text className="text-lg font-bold text-gray-900">
      {bookings.length === 0 ? "No bookings yet" : "No matching bookings"}
    </Text>

    <Text className="mt-2 text-center text-gray-500">
      {bookings.length === 0
        ? "When clients book with you, their appointments will appear here."
        : "Try changing the date or status filter."}
    </Text>
  </View>
}
        renderItem={({ item }) => (
          <View className="mb-4 rounded-2xl border border-gray-200 bg-white p-4">
            <View className="flex-row items-start justify-between gap-3">
              <View className="flex-1">
                <Text className="text-lg font-bold text-gray-900">
                  {item.clientName || "Client"}
                </Text>

                <Text className="mt-1 text-gray-500">
                  {item.appointmentDate || "No date selected"}
                </Text>
              </View>

              <Text
                className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${getStatusStyle(
                  item.status
                )}`}
              >
                {item.status || "unknown"}
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-700">
                Time
              </Text>

              <Text className="mt-1 text-gray-600">
                {formatTime12Hour(item.startTime)} -{" "}
                {formatTime12Hour(item.endTime)}
              </Text>
            </View>

            <View className="mt-4">
              <Text className="text-sm font-semibold text-gray-700">
                Services
              </Text>

              {item.services?.length > 0 ? (
                <View className="mt-2">
                  {item.services.map((service) => (
                    <Text
                      key={service.id}
                      className="mb-1 text-gray-600"
                    >
                      • {service.name} — ${service.price}
                    </Text>
                  ))}
                </View>
              ) : (
                <Text className="mt-1 text-gray-500">
                  No services listed
                </Text>
              )}
            </View>

            <View className="mt-4 flex-row justify-between border-t border-gray-100 pt-4">
              <View>
                <Text className="text-xs text-gray-500">
                  Duration
                </Text>
                <Text className="mt-1 font-semibold text-gray-900">
                  {item.totalDurationMinutes || 0} min
                </Text>
              </View>

              <View>
                <Text className="text-xs text-gray-500 text-right">
                  Total
                </Text>
                <Text className="mt-1 font-semibold text-gray-900">
                  ${item.totalPrice || 0}
                </Text>
              </View>
            </View>

           {item.status === "pending" && (
  <View
    style={{
      marginTop: 16,
      flexDirection: "row",
      justifyContent: "flex-end",
      columnGap: 8,
    }}
  >
    {renderActionButton(
      actionLoadingId === item.id ? "Working..." : "Cancel",
      () => handleStatusAction(item.id, "cancel"),
      "danger",
      actionLoadingId === item.id
    )}

    {renderActionButton(
      actionLoadingId === item.id ? "Working..." : "Confirm",
      () => handleStatusAction(item.id, "confirm"),
      "primary",
      actionLoadingId === item.id
    )}
  </View>
)}

         {item.status === "confirmed" && (
  <View
    style={{
      marginTop: 16,
      flexDirection: "row",
      justifyContent: "flex-end",
      columnGap: 8,
    }}
  >
    {renderActionButton(
      actionLoadingId === item.id ? "Working..." : "Cancel",
      () => handleStatusAction(item.id, "cancel"),
      "danger",
      actionLoadingId === item.id
    )}

    {renderActionButton(
      actionLoadingId === item.id ? "Working..." : "Complete",
      () => handleStatusAction(item.id, "complete"),
      "secondary",
      actionLoadingId === item.id
    )}
  </View>
)}
          </View>
        )}
      />
    </SafeAreaView>
  );
}