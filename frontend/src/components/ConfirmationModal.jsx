import {
  Modal,
  Pressable,
  Text,
  View,
} from "react-native";

export default function ConfirmationModal({
  visible,
  title = "Saved",
  detail = "Your changes have been saved.",
  confirmLabel = "OK",
  onClose,
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
          <Text className="text-center text-xl font-bold text-app-text">
            {title}
          </Text>

          <Text className="mt-4 text-center text-base leading-6 text-app-text-secondary">
            {detail}
          </Text>

          <View className="mt-6 items-center">
            <Pressable
              onPress={onClose}
              style={{ width: 160 }}
              className="rounded-xl bg-app-primary px-7 py-3 active:bg-app-primary-pressed"
            >
              <Text className="text-center font-semibold text-app-text-inverse">
                {confirmLabel}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
