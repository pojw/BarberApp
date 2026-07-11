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
import ConversationCard from "../../../components/messaging/conversationCard";

export default function BarberMessagesScreen() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser.uid) {
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
  }, [currentUser?.uid]);

  function openConversation(conversationId) {
    router.push(`/barber/conversation/${conversationId}`);
  }

function renderConversation({ item }) {
  const displayName =
    item.businessName ||
    item.barberName ||
    "Barber";

  return (
   <ConversationCard
  conversation={item}
  currentUserId={currentUser?.uid}
  displayName={
    item.businessName ||
    item.barberName ||
    "Barber"
  }
  secondaryName={
    item.businessName && item.barberName
      ? item.barberName
      : null
  }
  onPress={() => openConversation(item.id)}
/>
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