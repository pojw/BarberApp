import "../../global.css";

import { useEffect, useRef } from "react";
import { Stack, router } from "expo-router";
import * as Notifications from "expo-notifications";

import {
  AuthProvider,
  useAuth,
} from "../context/AuthContext";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NotificationResponseHandler() {
  const { userData, authLoading } = useAuth();

  const lastHandledNotificationId = useRef(null);

  useEffect(() => {
    if (authLoading || !userData?.role) {
      return;
    }

    function handleNotificationResponse(response) {
      const notificationId =
        response?.notification?.request?.identifier;

      if (
        notificationId &&
        lastHandledNotificationId.current === notificationId
      ) {
        return;
      }

      if (notificationId) {
        lastHandledNotificationId.current =
          notificationId;
      }

      const data =
        response?.notification?.request?.content?.data || {};

      const {
        type,
        conversationId,
      } = data;

      if (
        type === "new_message" &&
        conversationId
      ) {
        if (userData.role === "client") {
          router.push({
            pathname:
              "/client/conversation/[conversationId]",
            params: {
              conversationId,
            },
          });

          return;
        }

        if (userData.role === "barber") {
          router.push({
            pathname:
              "/barber/conversation/[conversationId]",
            params: {
              conversationId,
            },
          });

          return;
        }
      }

      if (type === "new_booking_request") {
        router.push("/barber/bookings");
        return;
      }

      if (
        type === "booking_confirmed" ||
        type === "booking_cancelled"
      ) {
        if (userData.role === "client") {
          router.push("/client/bookings");
          return;
        }

        if (userData.role === "barber") {
          router.push("/barber/bookings");
        }
      }
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener(
        handleNotificationResponse
      );

    async function handleInitialNotification() {
      try {
        const response =
          await Notifications.getLastNotificationResponseAsync();

        if (response) {
          handleNotificationResponse(response);
        }
      } catch (error) {
        console.error(
          "Failed to handle initial notification:",
          error
        );
      }
    }

    handleInitialNotification();

    return () => {
      subscription.remove();
    };
  }, [
    authLoading,
    userData?.role,
  ]);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NotificationResponseHandler />

      <Stack
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="client" />
        <Stack.Screen name="barber" />
      </Stack>
    </AuthProvider>
  );
}