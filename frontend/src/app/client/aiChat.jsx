import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useState ,useEffect} from "react";
import CenterScreen from "../../components/centerScreen";
import { sendChatRecommendation } from "../../services/aiChatService";
import { auth ,  db} from "../../config/firebase";
import {
  doc,
  getDoc,
} from "firebase/firestore";
import { router } from "expo-router";
import { getClientHairProfileState } from "../../services/hairProfileService";
function ChatBubble({ message }) {
  const isUser = message.role === "user";

  return (
    <View
      className={`mb-3 max-w-[75%] ${
        isUser ? "self-end items-end" : "self-start items-start"
      }`}
    >
      <View
        className={`rounded-2xl px-4 py-3 ${
          isUser
            ? "rounded-br-md bg-gray-900"
            : "rounded-bl-md bg-gray-100"
        }`}
      >
        <Text
          className={`text-base leading-6 ${
            isUser ? "text-white" : "text-gray-900"
          }`}
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}
export default function AiChatScreen() {

const [messages, setMessages] = useState([
  {
    id: "welcome-message",
    role: "assistant",
    text: "Ask me about haircuts, styling, products, or what to ask your barber.",
  },
]);

const [input, setInput] = useState("");
const [isSending, setIsSending] = useState(false);
const [error, setError] = useState("");

const [hasConfirmedProfile, setHasConfirmedProfile] = useState(false);
const [isCheckingProfile, setIsCheckingProfile] = useState(true);
useEffect(() => {
  async function loadHairProfileStatus() {
    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        setHasConfirmedProfile(false);
        return;
      }

      const profileState = await getClientHairProfileState(
        currentUser.uid
      );

      setHasConfirmedProfile(
        profileState.hasConfirmedProfile
      );
    } catch (err) {
      console.log(
        "Error checking Hair Profile status:",
        err
      );

      setHasConfirmedProfile(false);
    } finally {
      setIsCheckingProfile(false);
    }
  }

  loadHairProfileStatus();
}, []);

const handleSend = async () => {
  const trimmedInput = input.trim();

  if (!trimmedInput || isSending) {
    return;
  }

  setError("");

  const userMessage = {
    id: Date.now().toString(),
    role: "user",
    text: trimmedInput,
  };

  setMessages((currentMessages) => [
    ...currentMessages,
    userMessage,
  ]);

  setInput("");
  setIsSending(true);

  try {
const currentUser = auth.currentUser;

if (!currentUser) {
  setError("You must be signed in to use AI Chat.");
  setIsSending(false);
  return;
}   const result = await sendChatRecommendation({
  clientId: currentUser.uid,
  message: trimmedInput,
});

const assistantMessage = {
  id: `${Date.now()}-assistant`,
  role: "assistant",
  text: result.answer,
};
    setMessages((currentMessages) => [
      ...currentMessages,
      assistantMessage,
    ]);
  } catch {
    setError("Something went wrong. Please try again.");
  } finally {
    setIsSending(false);
  }
};


  return (
    
    <KeyboardAvoidingView
      className="flex-1 bg-white"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
        <CenterScreen>
      <View className="flex-1">
        {/* Header */}
        <View className="border-b border-gray-200 px-5 pb-4 pt-14">
          <Text className="text-2xl font-bold text-gray-900">
            AI Hair Assistant
          </Text>

          <Text className="mt-1 text-sm text-gray-500">
            Ask about haircuts, styling, products, or what to ask your barber.
          </Text>
        </View>

        {/* Hair Profile Status Placeholder */}
     {!isCheckingProfile && (
  <View className="mx-4 mt-4 rounded-2xl bg-gray-100 p-4">
    {hasConfirmedProfile ? (
      <>
        <Text className="font-semibold text-gray-900">
          Personalized recommendations
        </Text>

        <Text className="mt-1 text-sm text-gray-600">
          Using your Hair Profile for personalized recommendations.
        </Text>
      </>
    ) : (
      <>
        <Text className="font-semibold text-gray-900">
          Personalized recommendations
        </Text>

        <Text className="mt-1 text-sm text-gray-600">
          Complete your Hair Profile for more personalized recommendations.
        </Text>

        <TouchableOpacity
          onPress={() => router.push("/client/hairProfile")}
          className="mt-3 self-start rounded-xl bg-black px-4 py-2"
        >
          <Text className="font-semibold text-white">
            Analyze Your Hair
          </Text>
        </TouchableOpacity>
      </>
    )}
  </View>
)}

        {/* Messages Area */}
        <ScrollView
  className="flex-1 px-4"
  contentContainerStyle={{
    paddingTop: 20,
    paddingBottom: 20,
  }}
>
  {messages.map((message) => (
    <ChatBubble
      key={message.id}
      message={message}
    />
  ))}
</ScrollView>
{error ? (
  <Text className="mb-2 text-sm text-red-500">
    {error}
  </Text>
) : null}
        {/* Input Area */}
        <View className="border-t border-gray-200 bg-white px-4 pb-8 pt-3">
          <View className="flex-row items-end gap-2">
            <TextInput
  value={input}
  onChangeText={setInput}
  placeholder="Ask a hair question..."
  multiline
  editable={!isSending}
  className="max-h-32 min-h-12 flex-1 rounded-2xl bg-gray-100 px-4 py-3 text-base text-gray-900"
/>
<TouchableOpacity
  onPress={handleSend}
  disabled={isSending}
  className={`h-12 justify-center rounded-2xl px-5 ${
    isSending ? "bg-gray-400" : "bg-black"
  }`}
>
  <Text className="font-semibold text-white">
    {isSending ? "Sending..." : "Send"}
  </Text>
</TouchableOpacity>
          </View>
        </View>
      </View></CenterScreen>
    </KeyboardAvoidingView>
  );
}