import { useEffect, useState } from "react";
import {
  View,
  Text,
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
  const currentUser = auth.currentUser;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(Boolean(currentUser?.uid));
  const [errorMessage, setErrorMessage] = useState(
    currentUser?.uid ? "" : "You must be logged in to view messages."
  );

  useEffect(() => {
    if (!currentUser?.uid) {
      return;
    }

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
    item.clientName ||
    "Client";

  return (
   <ConversationCard
  conversation={item}
  currentUserId={currentUser?.uid}
  displayName={displayName}
  secondaryName={item.businessName || item.barberName || null}
  avatarUrl={item.clientProfileImageUrl || item.profileImageUrl || ""}
  onPress={() => openConversation(item.id)}
/>
  );
}

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-app-text-muted">
          Loading messages...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Messages Unavailable
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="px-5 pb-3 pt-4">
        <Text className="text-3xl font-bold text-app-text">
          Mess<Text className="text-app-primary">ages</Text>
        </Text>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerClassName="flex-grow px-5 pb-6"
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-xl font-bold text-app-text">
              No messages yet
            </Text>

            <Text className="mt-2 text-center text-base text-app-text-muted">
              When a client messages you, the conversation will appear here.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
