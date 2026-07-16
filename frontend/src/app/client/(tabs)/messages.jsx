import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  FlatList,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";

import { auth, db } from "../../../config/firebase";
import {
  getConversationsForUser,
  listenToUserConversations,
} from "../../../services/messageService";
import ConversationCard from "../../../components/messaging/conversationCard";

const MESSAGES_CACHE_KEY_PREFIX = "clientMessagesCache";

function getMessagesCacheKey(uid) {
  return `${MESSAGES_CACHE_KEY_PREFIX}:${uid}`;
}

function reviveCachedTimestamp(value) {
  if (!value || value.toDate) {
    return value;
  }

  const seconds = value.seconds ?? value._seconds;
  const nanoseconds = value.nanoseconds ?? value._nanoseconds ?? 0;

  if (typeof seconds !== "number") {
    return value;
  }

  const millis = seconds * 1000 + Math.floor(nanoseconds / 1000000);

  return {
    ...value,
    toDate: () => new Date(millis),
    toMillis: () => millis,
  };
}

function reviveCachedConversation(conversation) {
  const readState = conversation.readState
    ? Object.fromEntries(
        Object.entries(conversation.readState).map(([userId, timestamp]) => [
          userId,
          reviveCachedTimestamp(timestamp),
        ])
      )
    : conversation.readState;

  return {
    ...conversation,
    createdAt: reviveCachedTimestamp(conversation.createdAt),
    lastMessageAt: reviveCachedTimestamp(conversation.lastMessageAt),
    readState,
    updatedAt: reviveCachedTimestamp(conversation.updatedAt),
  };
}

function getBarberImageUrl(barber) {
  if (barber.profileImageUrl) {
    return barber.profileImageUrl;
  }

  if (Array.isArray(barber.portfolioImages)) {
    return barber.portfolioImages[0]?.url || "";
  }

  return "";
}

async function addBarberProfileImages(conversations) {
  return Promise.all(
    conversations.map(async (conversation) => {
      if (conversation.barberProfileImageUrl || !conversation.barberId) {
        return conversation;
      }

      try {
        const barberRef = doc(db, "barbers", conversation.barberId);
        const barberSnap = await getDoc(barberRef);

        if (!barberSnap.exists()) {
          return conversation;
        }

        return {
          ...conversation,
          barberProfileImageUrl: getBarberImageUrl(barberSnap.data()),
        };
      } catch (error) {
        console.log("Load conversation barber image error:", error);
        return conversation;
      }
    })
  );
}

export default function ClientMessagesScreen() {
  const router = useRouter();

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;

  const loadCachedConversations = useCallback(async (uid) => {
    try {
      const cachedMessages = await AsyncStorage.getItem(
        getMessagesCacheKey(uid)
      );

      if (!cachedMessages) {
        return false;
      }

      const parsedCache = JSON.parse(cachedMessages);

      if (Array.isArray(parsedCache.conversations)) {
        setConversations(
          parsedCache.conversations.map(reviveCachedConversation)
        );
        return true;
      }

      return false;
    } catch (error) {
      console.log("Load cached conversations error:", error);
      return false;
    }
  }, []);

  const saveConversationsCache = useCallback(async ({
    uid,
    loadedConversations,
  }) => {
    try {
      await AsyncStorage.setItem(
        getMessagesCacheKey(uid),
        JSON.stringify({
          conversations: loadedConversations,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.log("Save conversations cache error:", error);
    }
  }, []);

  const handleRefresh = useCallback(async () => {
    try {
      if (!currentUser?.uid) {
        return;
      }

      setRefreshing(true);
      setErrorMessage("");

      const loadedConversations =
        await getConversationsForUser(currentUser.uid);
      const conversationsWithImages =
        await addBarberProfileImages(loadedConversations);

      setConversations(conversationsWithImages);

      await saveConversationsCache({
        uid: currentUser.uid,
        loadedConversations: conversationsWithImages,
      });
    } catch (error) {
      console.log("Refresh client conversations error:", error);
    } finally {
      setRefreshing(false);
    }
  }, [currentUser?.uid, saveConversationsCache]);

  useEffect(() => {
    if (!currentUser) {
      setErrorMessage("You must be logged in to view messages.");
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage("");

    let hasCachedData = false;

    loadCachedConversations(currentUser.uid).then((cacheLoaded) => {
      hasCachedData = cacheLoaded;

      if (cacheLoaded) {
        setLoading(false);
      }
    });

    const unsubscribe = listenToUserConversations(
      currentUser.uid,
      async (loadedConversations) => {
        const conversationsWithImages =
          await addBarberProfileImages(loadedConversations);

        setConversations(conversationsWithImages);
        saveConversationsCache({
          uid: currentUser.uid,
          loadedConversations: conversationsWithImages,
        });
        setLoading(false);
      },
      (error) => {
        console.log("Listen to client conversations error:", error);
        if (!hasCachedData) {
          setErrorMessage("Failed to load conversations.");
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, loadCachedConversations, saveConversationsCache]);

  function openConversation(conversationId) {
    router.push(`/client/conversation/${conversationId}`);
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
  avatarUrl={item.barberProfileImageUrl || item.profileImageUrl || ""}
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
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderConversation}
        contentContainerClassName="flex-grow px-6 py-6"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-3xl font-bold text-app-text">
              Mess<Text className="text-app-primary">ages</Text>
            </Text>
          </View>
        }
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center px-6">
            <Text className="text-center text-xl font-bold text-app-text">
              No messages yet
            </Text>

            <Text className="mt-2 text-center text-base text-app-text-muted">
              Open a barber profile and tap Message Barber to start a conversation.
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
