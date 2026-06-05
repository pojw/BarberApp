import { useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../../config/firebase";
import ServiceCard from "../../components/barber/ServiceCard";
import ServiceForm from "../../components/barber/ServiceForm";
function createServiceId() {
  return `service_${Date.now()}`;
}

function normalizeServices(value) {
  if (!Array.isArray(value)) return [];

  return value.map((service, index) => {
    if (typeof service === "string") {
      return {
        id: `legacy_service_${index}`,
        name: service,
        price: 0,
        durationMinutes: 0,
        description: "",
      };
    }

    return {
      id: service.id || `service_${Date.now()}_${index}`,
      name: service.name || "",
      price: service.price ?? 0,
      durationMinutes: service.durationMinutes ?? 0,
      description: service.description || "",
    };
  });
}

export default function BarberServices() {
  const router = useRouter();

  const [services, setServices] = useState([]);

  const [serviceName, setServiceName] = useState("");
  const [price, setPrice] = useState("");
  const [durationMinutes, setDurationMinutes] = useState("");
  const [description, setDescription] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadServices() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const barberRef = doc(db, "barbers", currentUser.uid);
        const barberSnap = await getDoc(barberRef);

        if (!barberSnap.exists()) {
          Alert.alert(
            "Profile not found",
            "Your barber profile could not be found."
          );
          router.back();
          return;
        }

        const data = barberSnap.data();
        const existingServices = normalizeServices(data.services);

        setServices(existingServices);
        setShowForm(false);
      } catch (error) {
        console.log("Load barber services error:", error);
        Alert.alert("Error", "Something went wrong while loading services.");
      } finally {
        setLoading(false);
      }
    }

    loadServices();
  }, []);

  async function saveServices(nextServices) {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const barberRef = doc(db, "barbers", currentUser.uid);

    await updateDoc(barberRef, {
      services: nextServices,
      updatedAt: serverTimestamp(),
    });
  }

  function clearForm() {
    setServiceName("");
    setPrice("");
    setDurationMinutes("");
    setDescription("");
  }

  function handleStartCreateService() {
    clearForm();
    setEditingServiceId(null);
    setShowForm(true);
  }

  function handleStartEditService(service) {
    setEditingServiceId(service.id);
    setServiceName(service.name || "");
    setPrice(String(service.price ?? ""));
    setDurationMinutes(String(service.durationMinutes ?? ""));
    setDescription(service.description || "");
    setShowForm(true);
  }

  function handleCancelForm() {
    clearForm();
    setEditingServiceId(null);

    if (services.length > 0) {
      setShowForm(false);
    }
  }

  async function handleSaveService() {
    try {
      if (!serviceName.trim()) {
        Alert.alert("Missing service name", "Please enter a service name.");
        return;
      }

      if (!price.trim()) {
        Alert.alert("Missing price", "Please enter a price.");
        return;
      }

      if (!durationMinutes.trim()) {
        Alert.alert("Missing duration", "Please enter a duration.");
        return;
      }

      const numericPrice = Number(price);
      const numericDuration = Number(durationMinutes);

      if (Number.isNaN(numericPrice) || numericPrice < 0) {
        Alert.alert("Invalid price", "Please enter a valid price.");
        return;
      }

      if (Number.isNaN(numericDuration) || numericDuration <= 0) {
        Alert.alert(
          "Invalid duration",
          "Please enter a valid duration in minutes."
        );
        return;
      }

      setSaving(true);

      let nextServices;

      if (editingServiceId) {
        nextServices = services.map((service) =>
          service.id === editingServiceId
            ? {
                ...service,
                name: serviceName.trim(),
                price: numericPrice,
                durationMinutes: numericDuration,
                description: description.trim(),
              }
            : service
        );
      } else {
        const newService = {
          id: createServiceId(),
          name: serviceName.trim(),
          price: numericPrice,
          durationMinutes: numericDuration,
          description: description.trim(),
        };

        nextServices = [...services, newService];
      }

      await saveServices(nextServices);

      setServices(nextServices);
      clearForm();
      setEditingServiceId(null);
      setShowForm(false);

      Alert.alert(
        editingServiceId ? "Service updated" : "Service added",
        editingServiceId
          ? "Your service has been updated."
          : "Your new service has been saved."
      );
    } catch (error) {
      console.log("Save service error:", error);
      Alert.alert(
        "Save failed",
        "Something went wrong while saving the service."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteService(serviceId) {
    Alert.alert(
      "Delete service",
      "Are you sure you want to delete this service?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);

              const nextServices = services.filter(
                (service) => service.id !== serviceId
              );

              await saveServices(nextServices);

              setServices(nextServices);

              if (editingServiceId === serviceId) {
                clearForm();
                setEditingServiceId(null);
              }

              setShowForm(false);
            } catch (error) {
              console.log("Delete service error:", error);
              Alert.alert(
                "Delete failed",
                "Something went wrong while deleting."
              );
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading services...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-6 py-6"
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-6">
            <Text className="text-3xl font-bold text-black">
              Barber Services
            </Text>
            <Text className="mt-2 text-base text-gray-500">
              Manage the services clients can book with you.
            </Text>
          </View>

          <View className="mb-6">
            <Text className="mb-4 text-xl font-bold text-black">
              Current Services
            </Text>

            {services.length === 0 ? (
              <View className="rounded-3xl border border-gray-200 bg-white p-5">
                <Text className="text-base font-semibold text-black">
                  No services added yet.
                </Text>
                <Text className="mt-2 text-sm text-gray-500">
                  Add your first service so clients know what they can book.
                </Text>
              </View>
            ) : (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  saving={saving}
                  onEdit={() => handleStartEditService(service)}
                  onDelete={() => handleDeleteService(service.id)}
                />
              ))
            )}
          </View>

          {!showForm && (
            <Pressable
              onPress={handleStartCreateService}
              disabled={saving}
              className="mb-6 rounded-2xl bg-black px-4 py-4 active:opacity-80"
            >
              <Text className="text-center text-base font-bold text-white">
                Create New Service
              </Text>
            </Pressable>
          )}
<Modal
  visible={showForm}
  animationType="slide"
  presentationStyle="fullScreen"
  onRequestClose={handleCancelForm}
>
  <ServiceForm
    editing={!!editingServiceId}
    saving={saving}
    serviceName={serviceName}
    setServiceName={setServiceName}
    price={price}
    setPrice={setPrice}
    durationMinutes={durationMinutes}
    setDurationMinutes={setDurationMinutes}
    description={description}
    setDescription={setDescription}
    onSave={handleSaveService}
    onCancel={handleCancelForm}
  />
</Modal>

          <Pressable
            onPress={() => router.back()}
            disabled={saving}
            className="mb-10 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
          >
            <Text className="text-center text-base font-bold text-black">
              Back
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}