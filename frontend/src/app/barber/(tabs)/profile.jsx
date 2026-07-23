import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { auth, db } from "../../../config/firebase";
import { useAuth } from "../../../context/AuthContext";

const PAYMENT_OPTION_LABELS = {
  cash: "Cash",
  venmo: "Venmo",
  cash_app: "Cash App",
  zelle: "Zelle",
  apple_pay: "Apple Pay",
  card: "Card",
};

const PAYMENT_OPTIONS = [
  { id: "cash", label: "Cash" },
  { id: "venmo", label: "Venmo" },
  { id: "cash_app", label: "Cash App" },
  { id: "zelle", label: "Zelle" },
  { id: "apple_pay", label: "Apple Pay" },
  { id: "card", label: "Card" },
];

function InfoRow({ label, value, compact = false }) {
  return (
    <View className={compact ? "" : "mb-5"}>
      <Text className="mb-1 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <Text className="text-base font-semibold text-app-text">
        {value === undefined || value === null || value === ""
          ? "Not added yet"
          : String(value)}
      </Text>
    </View>
  );
}

function FormInput({
  label,
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = "default",
  autoCapitalize = "sentences",
}) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        {label}
      </Text>

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#8292A6"
        multiline={multiline}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        textAlignVertical={multiline ? "top" : "center"}
        className={`rounded-2xl border border-app-border bg-app-background-soft px-4 py-4 text-base text-app-text ${
          multiline ? "min-h-28" : ""
        }`}
      />
    </View>
  );
}

function PaymentOptionPicker({
  selectedPayments,
  onTogglePayment,
}) {
  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        Accepted Payments
      </Text>

      <View className="flex-row flex-wrap gap-2">
        {PAYMENT_OPTIONS.map((paymentOption) => {
          const isSelected = selectedPayments.includes(paymentOption.id);

          return (
            <Pressable
              key={paymentOption.id}
              onPress={() => onTogglePayment(paymentOption.id)}
              className={`rounded-full border px-4 py-2 ${
                isSelected
                  ? "border-app-primary bg-app-primary"
                  : "border-app-border bg-app-background-soft"
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  isSelected
                    ? "text-app-text-inverse"
                    : "text-app-text-secondary"
                }`}
              >
                {paymentOption.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function EditProfileModal({
  visible,
  businessName,
  phone,
  bio,
  city,
  stateValue,
  acceptedPayments,
  saving,
  onChangeBusinessName,
  onChangePhone,
  onChangeBio,
  onChangeCity,
  onChangeState,
  onTogglePayment,
  onClose,
  onSave,
}) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <Pressable
          onPress={saving ? undefined : onClose}
          className="flex-1 items-center justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
        >
          <Pressable
            onPress={(event) => event.stopPropagation()}
            className="max-h-[85%] w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
          >
            <View className="flex-row items-center justify-between">
              <Text className="text-xl font-bold text-app-text">
                Edit Profile
              </Text>

              <Pressable
                onPress={saving ? undefined : onClose}
                className="h-9 w-9 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
              >
                <Text className="text-base font-bold text-app-primary">
                  X
                </Text>
              </Pressable>
            </View>

            <ScrollView
              className="mt-5"
              showsVerticalScrollIndicator={false}
            >
              <FormInput
                label="Business Name"
                value={businessName}
                onChangeText={onChangeBusinessName}
                placeholder="Your barber or shop name"
                autoCapitalize="words"
              />

              <FormInput
                label="Phone"
                value={phone}
                onChangeText={onChangePhone}
                placeholder="Your phone number"
                keyboardType="phone-pad"
              />

              <FormInput
                label="City"
                value={city}
                onChangeText={onChangeCity}
                placeholder="Indianapolis"
                autoCapitalize="words"
              />

              <FormInput
                label="State"
                value={stateValue}
                onChangeText={onChangeState}
                placeholder="IN"
                autoCapitalize="characters"
              />

              <FormInput
                label="Bio"
                value={bio}
                onChangeText={onChangeBio}
                placeholder="Tell clients about your services..."
                multiline
              />

              <PaymentOptionPicker
                selectedPayments={acceptedPayments}
                onTogglePayment={onTogglePayment}
              />

              <View className="mt-2 flex-row gap-3">
                <Pressable
                  onPress={saving ? undefined : onClose}
                  className="flex-1 rounded-xl border border-app-border px-4 py-3"
                >
                  <Text className="text-center font-semibold text-app-text-secondary">
                    Cancel
                  </Text>
                </Pressable>

                <Pressable
                  onPress={saving ? undefined : onSave}
                  className={`flex-1 rounded-xl px-4 py-3 ${
                    saving
                      ? "bg-app-disabled"
                      : "bg-app-primary active:bg-app-primary-pressed"
                  }`}
                >
                  <Text className="text-center font-semibold text-app-text-inverse">
                    {saving ? "Saving..." : "Save"}
                  </Text>
                </Pressable>
              </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function InfoPair({ leftLabel, leftValue, rightLabel, rightValue }) {
  return (
    <View className="mb-5 flex-row gap-4">
      <View className="flex-1">
        <InfoRow label={leftLabel} value={leftValue} compact />
      </View>

      <View className="flex-1">
        <InfoRow label={rightLabel} value={rightValue} compact />
      </View>
    </View>
  );
}

function PaymentOptionsSection({ acceptedPayments }) {
  const safePayments = Array.isArray(acceptedPayments)
    ? acceptedPayments
    : [];

  return (
    <View className="mb-5">
      <Text className="mb-2 text-sm font-semibold text-app-text-muted">
        Accepted Payments
      </Text>

      {safePayments.length === 0 ? (
        <Text className="text-base font-semibold text-app-text">
          Not added yet
        </Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {safePayments.map((paymentId) => (
            <View
              key={paymentId}
              className="rounded-full bg-app-primary-soft px-3 py-2"
            >
              <Text className="text-sm font-semibold text-app-primary">
                {PAYMENT_OPTION_LABELS[paymentId] || paymentId}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function RatingStars({ rating, reviewCount }) {
  const roundedRating = Math.round(Number(rating || 0));

  return (
    <View className="mt-2 flex-row items-center">
      {Array.from({ length: 5 }, (_, index) => (
        <Ionicons
          key={index}
          name={index < roundedRating ? "star" : "star-outline"}
          size={16}
          color="#1677FF"
        />
      ))}

      <Text className="ml-2 text-sm font-semibold text-app-text-muted">
        ({reviewCount || 0})
      </Text>
    </View>
  );
}

export default function BarberProfile() {
  const router = useRouter();
  const { logout } = useAuth();
  const [userData, setUserData] = useState(null);
  const [barberData, setBarberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [editBusinessName, setEditBusinessName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editCity, setEditCity] = useState("");
  const [editStateValue, setEditStateValue] = useState("");
  const [editAcceptedPayments, setEditAcceptedPayments] = useState([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const barberRef = doc(db, "barbers", currentUser.uid);

        const [userSnap, barberSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(barberRef),
        ]);

        if (!userSnap.exists()) {
          setErrorMessage("User account data could not be found.");
          return;
        }

        if (!barberSnap.exists()) {
          setErrorMessage("Barber profile data could not be found.");
          return;
        }

        setUserData(userSnap.data());
        setBarberData(barberSnap.data());
      } catch (error) {
        console.log("Barber profile load error:", error);
        setErrorMessage("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  async function handleLogout() {
    try {
      await logout();
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  }

  function openEditModal() {
    setEditBusinessName(barberData?.businessName || "");
    setEditPhone(barberData?.phone || "");
    setEditBio(barberData?.bio || "");
    setEditCity(barberData?.location?.city || "");
    setEditStateValue(barberData?.location?.state || "");
    setEditAcceptedPayments(
      Array.isArray(barberData?.acceptedPayments)
        ? barberData.acceptedPayments
        : []
    );
    setEditModalVisible(true);
  }

  function closeEditModal() {
    if (savingProfile) {
      return;
    }

    setEditModalVisible(false);
  }

  function toggleEditPayment(paymentId) {
    setEditAcceptedPayments((currentPayments) => {
      if (currentPayments.includes(paymentId)) {
        return currentPayments.filter((id) => id !== paymentId);
      }

      return [...currentPayments, paymentId];
    });
  }

  async function handleSaveProfile() {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      router.replace("/login");
      return;
    }

    if (!editBusinessName.trim()) {
      Alert.alert(
        "Missing business name",
        "Please enter your business name."
      );
      return;
    }

    if (editAcceptedPayments.length === 0) {
      Alert.alert(
        "Payment option required",
        "Please select at least one accepted payment option."
      );
      return;
    }

    try {
      setSavingProfile(true);

      const barberRef = doc(db, "barbers", currentUser.uid);
      const nextBarberData = {
        businessName: editBusinessName.trim(),
        phone: editPhone.trim(),
        bio: editBio.trim(),
        location: {
          city: editCity.trim(),
          state: editStateValue.trim(),
        },
        acceptedPayments: editAcceptedPayments,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(barberRef, nextBarberData);

      setBarberData((currentData) => ({
        ...currentData,
        ...nextBarberData,
      }));
      setEditModalVisible(false);
    } catch (error) {
      console.log("Save barber profile modal error:", error);
      Alert.alert(
        "Save failed",
        "Something went wrong while saving your profile."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-app-text-muted">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-2xl font-bold text-app-text">
          Profile Error
        </Text>

        <Text className="mt-3 text-center text-base text-app-text-muted">
          {errorMessage}
        </Text>

        <Pressable
          onPress={handleLogout}
          className="mt-8 rounded-2xl bg-app-primary px-6 py-4 active:bg-app-primary-pressed"
        >
          <Text className="font-bold text-app-text-inverse">Log Out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const profileName =
    barberData?.businessName ||
    userData?.fullName ||
    "Barber";
  const city = barberData?.location?.city;
  const state = barberData?.location?.state;
  const locationText =
    city && state
      ? `${city}, ${state}`
      : city || state || "Location not added";
  const profileImageUrl =
    barberData?.profileImageUrl ||
    userData?.profileImageUrl ||
    "";
  const profileInitial = profileName.trim().charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-5 pb-6 pt-4"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8 flex-row items-start justify-between">
          <Text className="text-3xl font-bold text-app-text">
            Barber<Text className="text-app-primary">Profile</Text>
          </Text>

          <Pressable
            onPress={() => router.push("/barber/settings")}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="settings-outline"
              size={22}
              color="#1677FF"
            />
          </Pressable>
        </View>

        <View className="mb-8 items-center self-center" style={{ width: "88%" }}>
          {profileImageUrl ? (
            <Image
              source={{ uri: profileImageUrl }}
              style={{ width: 108, height: 108, borderRadius: 54 }}
              className="bg-app-surface-elevated"
            />
          ) : (
            <View
              style={{ width: 108, height: 108, borderRadius: 54 }}
              className="items-center justify-center bg-app-primary-soft"
            >
              <Text className="text-5xl font-bold text-app-primary">
                {profileInitial}
              </Text>
            </View>
          )}

          <Text className="mt-4 text-center text-2xl font-bold text-app-text">
            {profileName}
          </Text>

          <RatingStars
            rating={barberData?.rating}
            reviewCount={barberData?.reviewCount}
          />
        </View>

        <View className="mb-6 self-center" style={{ width: "88%" }}>
          <InfoPair
            leftLabel="Full Name"
            leftValue={userData?.fullName}
            rightLabel="Phone"
            rightValue={barberData?.phone}
          />

          <InfoPair
            leftLabel="Location"
            leftValue={locationText}
            rightLabel="Rating"
            rightValue={`${Number(barberData?.rating || 0).toFixed(1)} / 5`}
          />

          <PaymentOptionsSection
            acceptedPayments={barberData?.acceptedPayments}
          />

          <InfoRow label="Bio" value={barberData?.bio} />
        </View>

        <Pressable
          onPress={openEditModal}
          className="mb-4 self-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
          style={{ width: "88%" }}
        >
          <Text className="text-center text-base font-bold text-app-text">
            Edit Profile
          </Text>
        </Pressable>

        <Pressable
          onPress={handleLogout}
          className="mb-10 self-center rounded-2xl border border-app-border bg-app-surface px-4 py-4 active:bg-app-surface-elevated"
          style={{ width: "88%" }}
        >
          <Text className="text-center text-base font-bold text-app-text-muted">
            Log Out
          </Text>
        </Pressable>
      </ScrollView>

      <EditProfileModal
        visible={editModalVisible}
        businessName={editBusinessName}
        phone={editPhone}
        bio={editBio}
        city={editCity}
        stateValue={editStateValue}
        acceptedPayments={editAcceptedPayments}
        saving={savingProfile}
        onChangeBusinessName={setEditBusinessName}
        onChangePhone={setEditPhone}
        onChangeBio={setEditBio}
        onChangeCity={setEditCity}
        onChangeState={setEditStateValue}
        onTogglePayment={toggleEditPayment}
        onClose={closeEditModal}
        onSave={handleSaveProfile}
      />
    </SafeAreaView>
  );
}
