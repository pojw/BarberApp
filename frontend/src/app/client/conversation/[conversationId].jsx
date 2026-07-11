import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import { auth } from "../../../config/firebase";
import {
  getConversationById,
  listenToConversationMessages,
  sendMessage,
  markConversationRead,
} from "../../../services/messageService";

export default function ClientConversationScreen() {
  const router = useRouter();
  const { conversationId } = useLocalSearchParams();

  const listRef = useRef(null);

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);

  const [messageText, setMessageText] = useState("");

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = auth.currentUser;
useFocusEffect(
  useCallback(() => {
    if (
      !currentUser?.uid ||
      !conversationId ||
      Array.isArray(conversationId)
    ) {
      return;
    }

    markConversationRead(
      conversationId,
      currentUser.uid
    ).catch((error) => {
      console.log(
        "Mark conversation read error:",
        error
      );
    });
  }, [conversationId, currentUser?.uid])
);
  useEffect(() => {
    async function loadConversation() {
      try {
        setLoading(true);
        setErrorMessage("");

        if (!currentUser) {
          setErrorMessage("You must be logged in to view this conversation.");
          return;
        }

        if (!conversationId || Array.isArray(conversationId)) {
          setErrorMessage("A valid conversation ID was not provided.");
          return;
        }

        const loadedConversation = await getConversationById(conversationId);

        if (!loadedConversation) {
          setErrorMessage("This conversation could not be found.");
          return;
        }

        if (!loadedConversation.participants?.includes(currentUser.uid)) {
          setErrorMessage("You do not have access to this conversation.");
          return;
        }

        setConversation(loadedConversation);
      } catch (error) {
        console.log("Load conversation error:", error);
        setErrorMessage("Failed to load conversation.");
      } finally {
        setLoading(false);
      }
    }

    loadConversation();
  }, [conversationId]);

  useEffect(() => {
    if (!conversationId || Array.isArray(conversationId)) {
      return;
    }

    const unsubscribe = listenToConversationMessages(
      conversationId,
     (loadedMessages) => {
  setMessages(loadedMessages);

  const latestMessage =
    loadedMessages[loadedMessages.length - 1];

  if (
    currentUser?.uid &&
    latestMessage &&
    latestMessage.senderId !== currentUser.uid
  ) {
    markConversationRead(
      conversationId,
      currentUser.uid
    ).catch((error) => {
      console.log(
        "Mark incoming message read error:",
        error
      );
    });
  }

  setTimeout(() => {
    listRef.current?.scrollToEnd({ animated: true });
  }, 100);
},
      (error) => {
        console.log("Listen to messages error:", error);
        setErrorMessage("Failed to load messages.");
      }
    );

    return () => unsubscribe();
  }, [conversationId,currentUser?.uid]);

  async function handleSendMessage() {
    try {
      const trimmedText = messageText.trim();

      if (!currentUser) {
        Alert.alert("Login required", "You must be logged in to send messages.");
        return;
      }

      if (!conversationId || Array.isArray(conversationId)) {
        Alert.alert("Missing conversation", "Could not find this conversation.");
        return;
      }

      if (!trimmedText) {
        return;
      }

      setSending(true);

      await sendMessage({
        conversationId,
        senderId: currentUser.uid,
        senderName:
          conversation?.clientName ||
          currentUser.displayName ||
          "Client",
        text: trimmedText,
      });

      setMessageText("");
    } catch (error) {
      console.log("Send message error:", error);
      Alert.alert("Message failed", "Could not send your message.");
    } finally {
      setSending(false);
    }
  }

  function renderMessage({ item }) {
    const isMyMessage = item.senderId === currentUser?.uid;



    return (
      <View
        style={{
          alignSelf: isMyMessage ? "flex-end" : "flex-start",
          backgroundColor: isMyMessage ? "#000000" : "#f3f4f6",
          maxWidth: "80%",
        }}
        className="mb-3 rounded-2xl px-4 py-3"
      >
        <Text
          style={{
            color: isMyMessage ? "#ffffff" : "#000000",
          }}
          className="text-base"
        >
          {item.text}
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />

        <Text className="mt-4 text-gray-500">
          Loading conversation...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage || !conversation) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-2xl font-bold text-black">
          Conversation Not Found
        </Text>

        <Text className="mt-3 text-center text-base text-gray-500">
          {errorMessage || "This conversation could not be loaded."}
        </Text>

        <Pressable
          onPress={() => router.back()}
          className="mt-8 rounded-2xl bg-black px-6 py-4"
        >
          <Text className="font-bold text-white">Go Back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <View className="border-b border-gray-200 px-5 py-4">
          <Pressable
            onPress={() => router.back()}
            className="mb-3 self-start rounded-xl bg-gray-100 px-4 py-2"
          >
            <Text className="font-semibold text-black">Back</Text>
          </Pressable>

          <Text className="text-xl font-bold text-black">
            {conversation.businessName ||
              conversation.barberName ||
              "Barber"}
          </Text>

          {conversation.businessName && conversation.barberName ? (
            <Text className="mt-1 text-sm text-gray-500">
              {conversation.barberName}
            </Text>
          ) : null}
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerClassName="flex-grow px-5 py-4"
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center px-6">
              <Text className="text-center text-base text-gray-500">
                No messages yet. Send the first message.
              </Text>
            </View>
          }
          onContentSizeChange={() => {
            listRef.current?.scrollToEnd({ animated: true });
          }}
        />

        <View className="border-t border-gray-200 px-4 py-3">
          <View className="flex-row items-end rounded-2xl bg-gray-100 px-4 py-2">
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              multiline
              className="max-h-28 flex-1 py-2 text-base text-black"
            />

            <Pressable
              onPress={handleSendMessage}
              disabled={sending || !messageText.trim()}
              style={{
                backgroundColor:
                  sending || !messageText.trim()
                    ? "#d1d5db"
                    : "#000000",
              }}
              className="ml-3 rounded-xl px-4 py-3"
            >
              <Text className="font-bold text-white">
                {sending ? "..." : "Send"}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}