import { useCallback, useState ,useEffect} from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,Pressable
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {router, useFocusEffect } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { auth,db } from "../../../config/firebase";
import {
  listenToUnreadNotificationCount,
} from "../../../services/notificationService";
import {
  getTodayDateString,
  isToday,
  isUpcomingOrToday,
} from "../../../utils/dateHelpers";

function QuickActionCard({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      className="rounded-2xl border border-gray-200 bg-gray-50 p-4 active:bg-gray-100"
    >
      <Text className="text-base font-semibold text-gray-900">
        {label}
      </Text>
    </Pressable>
  );
}
function SummaryCard({ title, value, description }) {
  return (
    <View className="flex-1 rounded-2xl border border-gray-200 bg-white p-4">
      <Text className="text-sm font-medium text-gray-500">
        {title}
      </Text>

      <Text className="mt-3 text-3xl font-bold text-gray-900">
        {value}
      </Text>

      <Text className="mt-2 text-xs text-gray-500">
        {description}
      </Text>
    </View>
  );
}
export default function BarberDashboardScreen() {
  const [barberData, setBarberData] = useState(null);
  const [userData, setUserData] = useState(null);

  const [todayBookings, setTodayBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [upcomingConfirmedBookings, setUpcomingConfirmedBookings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [
  unreadNotificationCount,
  setUnreadNotificationCount,
] = useState(0);
useEffect(() => {
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    setUnreadNotificationCount(0);
    return;
  }

  const unsubscribe =
    listenToUnreadNotificationCount(
      currentUser.uid,
      (count) => {
        setUnreadNotificationCount(count);
      },
      (error) => {
        console.log(
          "Listen to barber notification badge error:",
          error
        );

        setUnreadNotificationCount(0);
      }
    );

  return () => unsubscribe();
}, []);
  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You must be logged in to view your dashboard.");
        return;
      }

      const uid = currentUser.uid;

      const barberRef = doc(db, "barbers", uid);
      const userRef = doc(db, "users", uid);

      const [barberSnap, userSnap] = await Promise.all([
        getDoc(barberRef),
        getDoc(userRef),
      ]);

      if (barberSnap.exists()) {
        setBarberData(barberSnap.data());
      } else {
        setBarberData(null);
      }

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        setUserData(null);
      }

      const bookingsRef = collection(db, "bookings");

      const bookingsQuery = query(
        bookingsRef,
        where("barberId", "==", uid)
      );

      const bookingsSnap = await getDocs(bookingsQuery);

      const bookings = bookingsSnap.docs.map((bookingDoc) => ({
        id: bookingDoc.id,
        ...bookingDoc.data(),
      }));

      const today = getTodayDateString();

      const activeTodayBookings = bookings.filter((booking) => {
        const isActiveStatus =
          booking.status === "pending" || booking.status === "confirmed";

        return isToday(booking.appointmentDate) && isActiveStatus;
      });

      const pending = bookings.filter((booking) => {
        return booking.status === "pending";
      });

      const upcomingConfirmed = bookings.filter((booking) => {
        return (
          booking.status === "confirmed" &&
          isUpcomingOrToday(booking.appointmentDate)
        );
      });

      setTodayBookings(activeTodayBookings);
      setPendingBookings(pending);
      setUpcomingConfirmedBookings(upcomingConfirmed);
    } catch (err) {
      console.log("Error loading barber dashboard:", err);
      setError("Failed to load dashboard. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const displayName =
    barberData?.businessName ||
    userData?.fullName ||
    barberData?.fullName ||
    "Barber";

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-600">Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-red-500 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView className="flex-1 px-5 py-4">
       <View className="flex-row items-start justify-between">
  <View className="flex-1 pr-4">
    <Text className="text-2xl font-bold text-gray-900">
      Dashboard
    </Text>

    <Text className="mt-2 text-gray-600">
      Welcome back, {displayName}
    </Text>
  </View>

  <Pressable
    onPress={() => router.push("/barber/notifications")}
    className="relative h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 active:bg-gray-100"
  >
    <Text className="text-xl">🔔</Text>

    {unreadNotificationCount > 0 ? (
      <View
        style={{
          position: "absolute",
          top: -5,
          right: -5,
          minWidth: 20,
          height: 20,
          borderRadius: 10,
          backgroundColor: "#000000",
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 5,
        }}
      >
        <Text
          style={{
            color: "#ffffff",
            fontSize: 11,
            fontWeight: "700",
          }}
        >
          {unreadNotificationCount > 9
            ? "9+"
            : unreadNotificationCount}
        </Text>
      </View>
    ) : null}
  </Pressable>
</View>
        <View className="mt-6">
  <Text className="text-lg font-semibold text-gray-900">
    Overview
  </Text>

  <View className="mt-3 gap-3">
    <SummaryCard
      title="Today’s Appointments"
      value={todayBookings.length}
      description="Pending or confirmed bookings for today"
    />

    <SummaryCard
      title="Pending Requests"
      value={pendingBookings.length}
      description="Bookings waiting for your response"
    />

    <SummaryCard
      title="Upcoming Confirmed"
      value={upcomingConfirmedBookings.length}
      description="Confirmed bookings from today forward"
    />
  </View>
</View>
<View className="mt-8 mb-8">
  <Text className="text-lg font-semibold text-gray-900">
    Quick Actions
  </Text>

  <View className="mt-3 gap-3">
    <QuickActionCard
      label="View Bookings"
      onPress={() => router.push("/barber/bookings")}
    />

    <QuickActionCard
      label="Manage Services"
      onPress={() => router.push("/barber/services")}
    />

    <QuickActionCard
      label="Manage Availability"
      onPress={() => router.push("/barber/availability")}
    />

    <QuickActionCard
      label="Messages"
      onPress={() => router.push("/barber/messages")}
    />

    <QuickActionCard
      label="Profile"
      onPress={() => router.push("/barber/profile")}
    />
  </View>
</View>
      </ScrollView>
    </SafeAreaView>
  );
}