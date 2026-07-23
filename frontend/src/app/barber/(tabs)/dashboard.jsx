import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";
import {
  listenToUnreadNotificationCount,
} from "../../../services/notificationService";
import {
  getBarberClient,
} from "../../../services/barberClientService";
import {
  isToday,
  isUpcomingOrToday,
} from "../../../utils/dateHelpers";
import { formatTime12Hour } from "../../../utils/bookingTime";

function QuickActionCard({ label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{ minWidth: 138 }}
      className="rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
    >
      <Text className="text-center text-sm font-semibold text-app-text-inverse">
        {label}
      </Text>
    </Pressable>
  );
}
function SummaryCard({ title, value, description }) {
  return (
    <View
      style={{ width: "48%" }}
      className="rounded-2xl mt-4 border border-app-border bg-app-surface py-4 px-4"
    >
      <Text className="text-sm font-semibold text-app-text-secondary">
        {title}
      </Text>

      <Text className="mt-2 text-3xl font-bold text-app-text">
        {value}
      </Text>

      <Text className="mt-2 text-xs text-app-text-muted">
        {description}
      </Text>
    </View>
  );
}

function DailyCalendarPreview({ todayBookingCount }) {
  return (
    <View className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4">
      <View className="flex-row items-center">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-app-primary-soft">
          <Ionicons
            name="calendar-outline"
            size={28}
            color="#1677FF"
          />
        </View>

        <View className="flex-1">
          <Text className="text-base font-bold text-app-text">
            Daily Calendar
          </Text>

          <Text className="mt-1 text-sm text-app-text-secondary">
            {todayBookingCount > 0
              ? `${todayBookingCount} appointments scheduled today`
              : "Your daily schedule will show here"}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-xl bg-app-surface-elevated px-4 py-3">
        <Text className="text-center text-sm font-semibold text-app-text-muted">
          Mini calendar coming soon
        </Text>
      </View>
    </View>
  );
}

function getServicesText(booking) {
  if (!Array.isArray(booking?.services) || booking.services.length === 0) {
    return "No services listed";
  }

  return booking.services
    .map((service) => service.name)
    .filter(Boolean)
    .join(", ");
}

function getClientNoteText(booking) {
  return (
    booking?.clientNotes?.trim() ||
    booking?.note?.trim() ||
    booking?.notes?.trim() ||
    "No client note yet."
  );
}

function getPrivateClientNoteText(barberClient) {
  return (
    barberClient?.privateNote?.body?.trim() ||
    "No private client note yet."
  );
}

function NextClientCard({ booking, barberClient }) {
  if (!booking) {
    return (
      <View className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4">
        <Text className="text-base font-bold text-app-text">
          No next client yet
        </Text>

        <Text className="mt-2 text-sm text-app-text-secondary">
          Your next pending or confirmed booking will show here.
        </Text>
      </View>
    );
  }

  const servicesText = getServicesText(booking);
  const clientNoteText = getClientNoteText(booking);
  const privateClientNoteText = getPrivateClientNoteText(barberClient);

  return (
    <Pressable
      onPress={() => {
        if (booking.id) {
          router.push({
            pathname: "/barber/bookings",
            params: {
              bookingId: booking.id,
            },
          });
          return;
        }

        router.push("/barber/bookings");
      }}
      className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-start">
        <View className="mr-4 h-14 w-14 items-center justify-center rounded-full bg-app-primary-soft">
          <Text className="text-xl font-bold text-app-primary">
            {(booking.clientName || "C").charAt(0).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1">
          <View className="flex-row items-start justify-between">
            <View className="flex-1 pr-3">
              <Text className="text-base font-bold text-app-text">
                {booking.clientName || "Client"}
              </Text>

              <Text className="mt-1 text-sm text-app-text-secondary">
                {booking.appointmentDate || "Date not set"} •{" "}
                {formatTime12Hour(booking.startTime)}
              </Text>
            </View>

            <Ionicons
              name="chevron-forward"
              size={22}
              color="#8292A6"
            />
          </View>

          <View className="mt-4 rounded-xl bg-app-surface-elevated px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-text-muted">
              Service
            </Text>

            <Text className="mt-1 text-sm font-semibold text-app-text">
              {servicesText}
            </Text>
          </View>

          <View className="mt-3 rounded-xl bg-app-surface-elevated px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-text-muted">
              Client Note
            </Text>

            <Text className="mt-1 text-sm text-app-text-secondary">
              {clientNoteText}
            </Text>
          </View>

          <View className="mt-3 rounded-xl bg-app-primary-soft px-4 py-3">
            <Text className="text-xs font-semibold uppercase text-app-primary">
              Private Client Note
            </Text>

            <Text className="mt-1 text-sm text-app-text-secondary">
              {privateClientNoteText}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function BarberDashboardScreen() {
  const [todayBookings, setTodayBookings] = useState([]);
  const [pendingBookings, setPendingBookings] = useState([]);
  const [upcomingConfirmedBookings, setUpcomingConfirmedBookings] =
    useState([]);
  const [nextClientBooking, setNextClientBooking] = useState(null);
  const [nextClientContact, setNextClientContact] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] =
    useState(0);

  useEffect(() => {
    const currentUser = auth.currentUser;

    if (!currentUser?.uid) {
      return;
    }

    const unsubscribe = listenToUnreadNotificationCount(
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

      const nextActiveBooking = bookings
        .filter((booking) => {
          const isActiveStatus =
            booking.status === "pending" ||
            booking.status === "confirmed";

          return (
            isActiveStatus &&
            isUpcomingOrToday(booking.appointmentDate)
          );
        })
        .sort((a, b) => {
          const dateA = `${a.appointmentDate || ""} ${
            a.startTime || ""
          }`;
          const dateB = `${b.appointmentDate || ""} ${
            b.startTime || ""
          }`;

          return dateA.localeCompare(dateB);
        })[0];

      let nextBarberClient = null;

      if (nextActiveBooking?.clientId) {
        nextBarberClient = await getBarberClient({
          barberId: uid,
          clientId: nextActiveBooking.clientId,
        });
      }

      setTodayBookings(activeTodayBookings);
      setPendingBookings(pending);
      setUpcomingConfirmedBookings(upcomingConfirmed);
      setNextClientBooking(nextActiveBooking || null);
      setNextClientContact(nextBarberClient);
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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-app-text-secondary">
          Loading dashboard...
        </Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center px-6">
        <Text className="text-center text-app-primary">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView className="flex-1 px-5 py-4">
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-app-text">
              Dash<Text className="text-app-primary">board</Text>
            </Text>
          </View>

          <Pressable
            onPress={() => router.push("/barber/notifications")}
            className="relative items-center justify-center rounded-full bg-app-primary-soft p-2 active:bg-app-surface-elevated"
          >
            <Ionicons
              name="notifications-outline"
              size={28}
              color="#0B1F3A"
            />

            {unreadNotificationCount > 0 ? (
              <View
                style={{
                  position: "absolute",
                  top: -5,
                  right: -5,
                  minWidth: 20,
                  height: 20,
                  borderRadius: 10,
                  backgroundColor: "#0EA5E9",
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

        <View className="mt-2">
          <Text className="text-xl font-bold text-app-text">
            Overview
          </Text>

          <View className="mt-0 flex-row  flex-wrap justify-between  ">
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

        <View className="mt-4">
          <Text className="text-xl font-bold text-app-text">
            Today
          </Text>

          <DailyCalendarPreview
            todayBookingCount={todayBookings.length}
          />
        </View>

        <View className="mt-4">
          <Text className="text-xl font-bold text-app-text">
            Next Client
          </Text>

          <NextClientCard
            booking={nextClientBooking}
            barberClient={nextClientContact}
          />
        </View>

        <View className="mb-8 mt-4">
          <Text className="text-xl font-bold text-app-text">
            Quick Actions
          </Text>

          <View className="mt-3 rounded-2xl border border-app-border bg-app-surface-elevated py-4">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                gap: 12,
                paddingHorizontal: 16,
              }}
            >
              <QuickActionCard
                label="Calendar"
                onPress={() => router.push("/barber/calender")}
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
                label="AI Assistant"
                onPress={() => router.push("/barber/chatbot")}
              />

              <QuickActionCard
                label="Client List"
                onPress={() => router.push("/barber/clients")}
              />

              <QuickActionCard
                label="Profile"
                onPress={() => router.push("/barber/profile")}
              />
            </ScrollView>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
