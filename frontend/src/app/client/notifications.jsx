import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { auth } from "../../config/firebase";
import {
  listenToNotifications,
  markAllNotificationsRead,  markNotificationRead,

} from "../../services/notificationService";

export default function ClientNotificationsScreen() {
  const router = useRouter();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      setErrorMessage("You must be logged in to view notifications.");
      setLoading(false);
      return;
    }

    const unsubscribe = listenToNotifications(
      currentUser.uid,
      (loadedNotifications) => {
        setNotifications(loadedNotifications);
        setLoading(false);
      },
      () => {
        setErrorMessage("Failed to load notifications.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);
async function handleNotificationPress(notification) {
  try {
    if (!currentUser?.uid) {
      return;
    }

    if (!notification.isRead) {
      await markNotificationRead(
        currentUser.uid,
        notification.id
      );
    }
  } catch (error) {
    console.log(
      "Mark notification read error:",
      error
    );
  }
}
  async function handleMarkAllRead() {
    try {
      if (!currentUser?.uid) {
        return;
      }

      await markAllNotificationsRead(currentUser.uid);
    } catch (error) {
      console.log("Mark all notifications read error:", error);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-gray-500">
          Loading notifications...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          className="mb-3 self-start rounded-xl bg-gray-100 px-4 py-2"
        >
          <Text className="font-semibold text-black">
            Back
          </Text>
        </Pressable>

        <View className="flex-row items-center justify-between">
          <Text className="text-3xl font-bold text-black">
            Notifications
          </Text>

          {notifications.some((item) => !item.isRead) ? (
            <Pressable onPress={handleMarkAllRead}>
              <Text className="font-semibold text-black">
                Mark all read
              </Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {errorMessage ? (
        <View className="flex-1 items-center justify-center px-6">
          <Text className="text-center text-base text-red-600">
            {errorMessage}
          </Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
renderItem={({ item }) => (
  <Pressable
    onPress={() => handleNotificationPress(item)}
    className={
      item.isRead
        ? "mb-3 rounded-2xl border border-gray-200 bg-white p-4"
        : "mb-3 rounded-2xl border border-gray-200 bg-gray-100 p-4"
    }
  >
    <View className="flex-row items-start">
      <View className="flex-1 pr-3">
        <Text
          className={
            item.isRead
              ? "text-base font-semibold text-black"
              : "text-base font-bold text-black"
          }
        >
          {item.title}
        </Text>

        <Text
          className={
            item.isRead
              ? "mt-1 text-sm text-gray-500"
              : "mt-1 text-sm font-medium text-black"
          }
        >
          {item.body}
        </Text>
      </View>

      {!item.isRead ? (
        <View
          style={{
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: "#000000",
            marginTop: 4,
          }}
        />
      ) : null}
    </View>
  </Pressable>
)}          contentContainerClassName="flex-grow px-5 py-4"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-xl font-bold text-black">
                No notifications yet
              </Text>

              <Text className="mt-2 text-center text-base text-gray-500">
                Booking and message updates will appear here.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}