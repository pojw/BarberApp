import { View, Text, Pressable } from "react-native";

export default function ServiceCard({ service, saving, onEdit, onDelete }) {
  return (
    <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-5">
      <View className="mb-3 flex-row items-start justify-between">
        <View className="flex-1 pr-4">
          <Text className="text-xl font-bold text-black">
            {service.name || "Unnamed service"}
          </Text>

          <Text className="mt-1 text-sm text-gray-500">
            ${service.price ?? 0} • {service.durationMinutes ?? 0} min
          </Text>
        </View>

        <View className="flex-row gap-2">
          <Pressable
            onPress={onEdit}
            disabled={saving}
            className="rounded-xl bg-gray-100 px-3 py-2"
          >
            <Text className="text-sm font-bold text-black">Edit</Text>
          </Pressable>

          <Pressable
            onPress={onDelete}
            disabled={saving}
            className="rounded-xl bg-red-50 px-3 py-2"
          >
            <Text className="text-sm font-bold text-red-600">Delete</Text>
          </Pressable>
        </View>
      </View>

      {service.description ? (
        <Text className="text-base text-gray-600">{service.description}</Text>
      ) : (
        <Text className="text-base text-gray-400">No description added.</Text>
      )}
    </View>
  );
}