import { useEffect, useState } from "react";
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

export default function ClientTabLayout() {
  const [unreadConversationCount, setUnreadConversationCount] =
    useState(0);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) {
      setUnreadConversationCount(0);
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
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="search" />
      <Tabs.Screen name="bookings" />

      <Tabs.Screen
        name="messages"
        options={{
          tabBarBadge:
            unreadConversationCount > 0
              ? unreadConversationCount > 9
                ? "9+"
                : unreadConversationCount
              : undefined,
        }}
      />

      <Tabs.Screen name="profile" />
    </Tabs>
  );
}