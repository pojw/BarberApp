import { useEffect, useState } from "react";
import { View, Text, Pressable, ActivityIndicator, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";

function InfoRow({ label, value }) {
  return (
    <View className="mb-4">
      <Text className="mb-1 text-sm font-semibold text-gray-500">{label}</Text>
      <Text className="text-base font-medium text-black">
        {value || "Not added yet"}
      </Text>
    </View>
  );
}

function ListSection({ label, items }) {
  const safeItems = Array.isArray(items) ? items : [];

  return (
    <View className="mb-4">
      <Text className="mb-2 text-sm font-semibold text-gray-500">{label}</Text>

      {safeItems.length === 0 ? (
        <Text className="text-base text-black">None added yet</Text>
      ) : (
        <View className="flex-row flex-wrap gap-2">
          {safeItems.map((item, index) => (
            <View
              key={`${item}-${index}`}
              className="rounded-full bg-gray-100 px-3 py-2"
            >
              <Text className="text-sm font-medium text-black">{item}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function ClientProfile() {
  const router = useRouter();

  const [userData, setUserData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        const userRef = doc(db, "users", currentUser.uid);
        const clientRef = doc(db, "clients", currentUser.uid);

        const [userSnap, clientSnap] = await Promise.all([
          getDoc(userRef),
          getDoc(clientRef),
        ]);

        if (!userSnap.exists()) {
          setErrorMessage("User account data could not be found.");
          return;
        }

        if (!clientSnap.exists()) {
          setErrorMessage("Client profile data could not be found.");
          return;
        }

        setUserData(userSnap.data());
        setClientData(clientSnap.data());
      } catch (error) {
        console.log("Client profile load error:", error);
        setErrorMessage("Something went wrong while loading your profile.");
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  async function handleLogout() {
    try {
      await signOut(auth);
      router.replace("/login");
    } catch (error) {
      console.log("Logout error:", error);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-2xl font-bold text-black">
          Profile Error
        </Text>
        <Text className="mt-3 text-center text-base text-gray-500">
          {errorMessage}
        </Text>

        <Pressable
          onPress={handleLogout}
          className="mt-8 rounded-2xl bg-black px-6 py-4"
        >
          <Text className="font-bold text-white">Log Out</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView
        className="flex-1"
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-8">
          <Text className="text-3xl font-bold text-black">Client Profile</Text>
          <Text className="mt-2 text-base text-gray-500">
            Your account and client profile information.
          </Text>
        </View>

        <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
          <Text className="mb-5 text-xl font-bold text-black">
            Account Info
          </Text>

          <InfoRow label="Full Name" value={userData?.fullName} />
          <InfoRow label="Email" value={userData?.email} />
          <InfoRow label="Role" value={userData?.role} />
        </View>

        <View className="mb-6 rounded-3xl border border-gray-200 bg-white p-5">
          <Text className="mb-5 text-xl font-bold text-black">
            Client Details
          </Text>

          <InfoRow label="Preferred Name" value={clientData?.preferredName} />
          <InfoRow label="City" value={clientData?.location?.city} />
          <InfoRow label="State" value={clientData?.location?.state} />

          <ListSection
            label="Haircut Preferences"
            items={clientData?.haircutPreferences}
          />

          <ListSection
            label="Favorite Barbers"
            items={clientData?.favoriteBarbers}
          />
        </View>

        <Pressable
          onPress={handleLogout}
          className="mb-10 rounded-2xl bg-black px-4 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-bold text-white">
            Log Out
          </Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("../editProfile")}
          className="mb-10 rounded-2xl border border-gray-300 bg-white px-4 py-4 active:opacity-80"
        >
          <Text className="text-center text-base font-bold text-black">
            Edit Profile
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
