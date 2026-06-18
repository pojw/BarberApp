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

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function BarberMessagesScreen() {
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
        console.log("Listen to barber conversations error:", error);
        setErrorMessage("Failed to load conversations.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  function openConversation(conversationId) {
    router.push(`/barber/conversation/${conversationId}`);
  }

  function renderConversation({ item }) {
    const displayName = item.clientName || "Client";

    return (
      <Pressable
        onPress={() => openConversation(item.id)}
        className="mb-3 rounded-2xl border border-gray-200 bg-white p-4 active:opacity-80"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-base font-bold text-black">
              {displayName}
            </Text>

            {item.businessName ? (
              <Text className="mt-1 text-sm text-gray-500">
                {item.businessName}
              </Text>
            ) : null}

            <Text
              numberOfLines={1}
              className="mt-2 text-sm text-gray-500"
            >
              {item.lastMessage || "No messages yet."}
            </Text>
          </View>

          <Text className="text-xs text-gray-400">
            {formatConversationTime(item.lastMessageAt || item.updatedAt)}
          </Text>
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
          Conversations with clients will appear here.
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
              When a client messages you, the conversation will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}