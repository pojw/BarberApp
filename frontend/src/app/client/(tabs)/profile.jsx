import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useAuth } from "../../../context/AuthContext";import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../../config/firebase";

const PROFILE_CACHE_KEY_PREFIX = "clientProfileCache";

function getProfileCacheKey(uid) {
  return `${PROFILE_CACHE_KEY_PREFIX}:${uid}`;
}

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
  const { logout } = useAuth();


  const [userData, setUserData] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const loadCachedProfile = useCallback(async (uid) => {
    try {
      const cachedProfile = await AsyncStorage.getItem(
        getProfileCacheKey(uid)
      );

      if (!cachedProfile) {
        return false;
      }

      const parsedCache = JSON.parse(cachedProfile);

      setUserData(parsedCache.userData || null);
      setClientData(parsedCache.clientData || null);

      return true;
    } catch (error) {
      console.log("Load cached client profile error:", error);
      return false;
    }
  }, []);

  const saveProfileCache = useCallback(async ({
    uid,
    loadedUserData,
    loadedClientData,
  }) => {
    try {
      await AsyncStorage.setItem(
        getProfileCacheKey(uid),
        JSON.stringify({
          userData: loadedUserData,
          clientData: loadedClientData,
          cachedAt: Date.now(),
        })
      );
    } catch (error) {
      console.log("Save client profile cache error:", error);
    }
  }, []);

  const loadProfile = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      const currentUser = auth.currentUser;

      if (!currentUser) {
        router.replace("/login");
        return;
      }

      if (showLoader) {
        setLoading(true);
      }

      setErrorMessage("");

      if (useCache) {
        hasCachedData = await loadCachedProfile(currentUser.uid);

        if (hasCachedData) {
          setLoading(false);
        }
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

      const loadedUserData = userSnap.data();
      const loadedClientData = clientSnap.data();

      setUserData(loadedUserData);
      setClientData(loadedClientData);

      await saveProfileCache({
        uid: currentUser.uid,
        loadedUserData,
        loadedClientData,
      });
    } catch (error) {
      console.log("Client profile load error:", error);

      if (showErrorOnFailure && !hasCachedData) {
        setErrorMessage("Something went wrong while loading your profile.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedProfile, router, saveProfileCache]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile({
      showLoader: false,
      showErrorOnFailure: false,
    });
    setRefreshing(false);
  }, [loadProfile]);

  useEffect(() => {
    loadProfile({
      showLoader: true,
      useCache: true,
    });
  }, [loadProfile]);

  async function handleLogout() {
    try {
    await logout();
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#1677FF"
            colors={["#1677FF"]}
          />
        }
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
