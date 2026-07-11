import {
  Pressable,
  Text,
  View,
} from "react-native";

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

function isConversationUnread(
  conversation,
  currentUserId
) {
  if (
    !conversation?.lastMessageAt ||
    !conversation?.lastMessageSenderId ||
    !currentUserId
  ) {
    return false;
  }

  if (
    conversation.lastMessageSenderId ===
    currentUserId
  ) {
    return false;
  }

  const lastReadAt =
    conversation.readState?.[currentUserId];

  if (!lastReadAt) {
    return true;
  }

  return (
    conversation.lastMessageAt.toMillis() >
    lastReadAt.toMillis()
  );
}

export default function ConversationCard({
  conversation,
  currentUserId,
  displayName,
  secondaryName,
  onPress,
}) {
  const unread = isConversationUnread(
    conversation,
    currentUserId
  );

  return (
    <Pressable
      onPress={onPress}
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

          {secondaryName ? (
            <Text className="mt-1 text-sm text-gray-500">
              {secondaryName}
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
            {conversation.lastMessage || "No messages yet."}
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xs text-gray-400">
            {formatConversationTime(
              conversation.lastMessageAt ||
                conversation.updatedAt
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