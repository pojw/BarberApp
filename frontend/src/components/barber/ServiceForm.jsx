import { View, Text, TextInput, Pressable, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function ServiceForm({
  editing,
  saving,
  serviceName,
  setServiceName,
  price,
  setPrice,
  durationMinutes,
  setDurationMinutes,
  description,
  setDescription,
  onSave,
  onCancel,
}) {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
  contentContainerClassName="px-6 pt-16 pb-8"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8  flex-row items-center justify-between">
          <View className="flex-1 pr-4">
            <Text className="text-3xl font-bold text-black">
              {editing ? "Edit Service" : "New Service"}
            </Text>
            <Text className="mt-2 text-base text-gray-500">
              {editing
                ? "Update this service for your clients."
                : "Create a service clients can book."} 
            </Text>
          </View>

          <Pressable
            onPress={onCancel}
            disabled={saving}
            className="rounded-full bg-gray-100 px-4 py-3"
          >
            <Text className="font-bold text-black">Close</Text>
          </Pressable>
        </View>

        <View className="rounded-3xl border border-gray-200 bg-white p-5">
          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Service Name
            </Text>
            <TextInput
              value={serviceName}
              onChangeText={setServiceName}
              placeholder="Fade"
              placeholderTextColor="#9CA3AF"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Price
            </Text>
            <TextInput
              value={price}
              onChangeText={setPrice}
              placeholder="35"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-4">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Duration Minutes
            </Text>
            <TextInput
              value={durationMinutes}
              onChangeText={setDurationMinutes}
              placeholder="45"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <View className="mb-6">
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Description
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Clean fade with lineup"
              placeholderTextColor="#9CA3AF"
              multiline
              className="min-h-32 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
            />
          </View>

          <Pressable
            onPress={onSave}
            disabled={saving}
            className={`rounded-2xl px-4 py-4 active:opacity-80 ${
              saving ? "bg-gray-400" : "bg-black"
            }`}
          >
            <Text className="text-center text-base font-bold text-white">
              {saving ? "Saving..." : editing ? "Save Changes" : "Create Service"}
            </Text>
          </Pressable>

          <Pressable
            onPress={onCancel}
            disabled={saving}
            className="mt-4 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-black">
              Cancel
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}