import { useEffect, useState } from "react";
import { View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

import { auth } from "../../../config/firebase";
import { listenToUserConversations } from "../../../services/messageService";

function isConversationUnread(conversation, userId) {
  if (
    !conversation?.lastMessageAt ||
    !conversation?.lastMessageSenderId ||
    !userId
  ) {
    return false;
  }

  if (conversation.lastMessageSenderId === userId) {
    return false;
  }

  const lastReadAt = conversation.readState?.[userId];

  if (!lastReadAt) {
    return true;
  }

  return (
    conversation.lastMessageAt.toMillis() >
    lastReadAt.toMillis()
  );
}

function TabIcon({ focused, name, focusedName }) {
  return (
    <View
      className="items-center justify-center"
      style={[
        {
          width: focused ? 86 : 28,
          height: focused ? 50 : 28,
          borderRadius: 999,
        },
        focused ? { backgroundColor: "#1677FF" } : null,
      ]}
    >
      <Ionicons
        name={focused ? focusedName : name}
        size={focused ? 27 : 19}
        color={focused ? "#FFFFFF" : "#52657A"}
      />
    </View>
  );
}

export default function BarberTabLayout() {
  const [unreadConversationCount, setUnreadConversationCount] =
    useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

    const unsubscribe = listenToUserConversations(
      currentUser.uid,
      (loadedConversations) => {
        const unreadCount = loadedConversations.filter(
          (conversation) =>
          isConversationUnread(
              conversation,
              currentUser.uid
            )
        ).length;

        setUnreadConversationCount(unreadCount);
      },
      (error) => {
        console.log(
          "Listen to unread conversation count error:",
          error
        );

        setUnreadConversationCount(0);
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#FFFFFF",
        tabBarInactiveTintColor: "#52657A",
        tabBarStyle: {
          position: "absolute",
          left: "28%",
          right: "28%",
          bottom: 10,
          height: 58,
          paddingTop: 4,
          paddingBottom: 4,
          borderTopWidth: 0,
          borderRadius: 29,
          backgroundColor: "rgba(255,255,255,0.92)",
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="home-outline"
              focusedName="home"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="calender"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="bookings"
        options={{
          title: "Bookings",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="calendar-outline"
              focusedName="calendar"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="messages"
        options={{
          title: "Messages",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="chatbubble-ellipses-outline"
              focusedName="chatbubble-ellipses"
            />
          ),
          tabBarBadge:
            unreadConversationCount > 0
              ? unreadConversationCount > 9
                ? "9+"
                : unreadConversationCount
              : undefined,
        }}
      />

      <Tabs.Screen
        name="chatbot"
        options={{
          href: null,
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ focused }) => (
            <TabIcon
              focused={focused}
              name="person-outline"
              focusedName="person"
            />
          ),
        }}
      />
    </Tabs>
  );
}
