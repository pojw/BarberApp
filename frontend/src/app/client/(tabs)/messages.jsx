import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";

import { auth } from "../../../config/firebase";
import { listenToUserConversations } from "../../../services/messageService";

function formatConversationTime(timestamp) {
  if (!timestamp?.toDate) {
    return "";
  }

  const date = timestamp.toDate();
  const today = new Date();

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function ClientMessagesScreen() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setErrorMessage("You must be logged in to view messages.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    const unsubscribe = listenToUserConversations(
      currentUser.uid,
      (loadedConversations) => {
        setConversations(loadedConversations);
        setLoading(false);
      },
      (error) => {
        console.log("Listen to client conversations error:", error);
        setErrorMessage("Failed to load conversations.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function openConversation(conversationId) {
    router.push(`/client/conversation/${conversationId}`);
  }

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
function renderConversation({ item }) {
  const displayName =
    item.businessName ||
    item.barberName ||
    "Barber";

  const unread = isConversationUnread(
    item,
    currentUser?.uid
  );

  return (
    <Pressable
      onPress={() => openConversation(item.id)}
      className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80"
    >
      <View className="flex-row items-center">
        <View className="flex-1 pr-4">
          <Text
            className={
              unread
                ? "text-base font-bold text-black"
                : "text-base font-semibold text-black"
            }
          >
            {displayName}
          </Text>

          {item.businessName && item.barberName ? (
            <Text className="mt-1 text-sm text-gray-500">
              {item.barberName}
            </Text>
          ) : null}

          <Text
            numberOfLines={1}
            className={
              unread
                ? "mt-2 text-sm font-semibold text-black"
                : "mt-2 text-sm text-gray-500"
            }
          >
            {item.lastMessage || "No messages yet."}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xs text-gray-400">
            {formatConversationTime(
              item.lastMessageAt || item.updatedAt
            )}
          </Text>

       {unread ? (
  <View
    style={{
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: "#000000",
      marginTop: 12,
    }}
  />
) : null}
        </View>
      </View>
    </Pressable>
  );
}
  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-gray-500">
          Loading messages...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-2xl font-bold text-black">
          Messages Unavailable
        </Text>

        <Text className="mt-3 text-center text-base text-gray-500">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="border-b border-gray-200 px-6 py-5">
        <Text className="text-3xl font-bold text-black">
          Messages
        </Text>

        <Text className="mt-2 text-sm text-gray-500">
          Conversations with barbers will appear here.
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerClassName="flex-grow px-6 py-5"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-xl font-bold text-black">
              No messages yet
            </Text>

            <Text className="mt-2 text-center text-base text-gray-500">
              Open a barber profile and tap Message Barber to start a conversation.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}