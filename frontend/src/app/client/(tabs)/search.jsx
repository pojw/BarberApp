import { useEffect, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TextInput,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  collection,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";

import { auth, db } from "../../../config/firebase";

export default function ClientSearch() {
  const router = useRouter();

  const [barbers, setBarbers] = useState([]);
  const [clientData, setClientData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredBarbers = barbers.filter((barber) => {
    const query = searchQuery.toLowerCase().trim();
    if(!query){
      return true
    }
  return barber.businessName
    ?.toLowerCase()
    .includes(query);  })

  function clickableBarberItem(barber) {
    router.push(`/client/barber/${barber.id}`);
  }
  useEffect(() => {
    async function findBarbers() {
      try {
        const currentUser = auth.currentUser;

        if (!currentUser) {
          router.replace("/login");
          return;
        }

        // Reference to the logged-in client's specific document.
        const clientRef = doc(db, "clients", currentUser.uid);

        // Reference to the entire barbers collection.
        const barbersRef = collection(db, "barbers");

        // Fetch the client document and all barber documents together.
        const [clientSnap, barbersSnap] = await Promise.all([
          getDoc(clientRef),
          getDocs(barbersRef),
        ]);

        if (!clientSnap.exists()) {
          setErrorMessage("Client profile could not be found.");
          return;
        }

        setClientData(clientSnap.data());

        const barberList = barbersSnap.docs.map((barberDoc) => ({
          id: barberDoc.id,
          ...barberDoc.data(),
        }));

        setBarbers(barberList);
      } catch (error) {
        console.log("Find barbers error:", error);
        setErrorMessage("Something went wrong while loading barbers.");
      } finally {
        setLoading(false);
      }
    }

    findBarbers();
  }, []);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" />
        <Text className="mt-4 text-gray-500">Finding barbers...</Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white px-6">
        <Text className="text-center text-xl font-bold text-black">
          Search Error
        </Text>

        <Text className="mt-2 text-center text-gray-500">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <FlatList
        data={filteredBarbers}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 py-6"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View className="mb-6">
            <Text className="text-3xl font-bold text-black">
              Find a Barber
            </Text>

           
             <TextInput
      value={searchQuery}
      onChangeText={setSearchQuery}
      placeholder="Search barber or business name"
      placeholderTextColor="#9CA3AF"
      autoCapitalize="none"
      autoCorrect={false}
      className="mt-5 rounded-2xl border border-gray-300 bg-gray-50 px-4 py-4 text-base text-black"
    />
          </View>
        }
        ListEmptyComponent={
          <View className="rounded-3xl border border-gray-200 bg-white p-5">
            <Text className="text-center text-gray-500">
              No barbers were found.
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => clickableBarberItem(item)}>
          <View className="mb-4 rounded-3xl border border-gray-200 bg-white p-5">
            <Text className="text-xl font-bold text-black">
              {item.businessName || "Unnamed Barber"}
            </Text>

            <Text className="mt-2 text-gray-500">
              {item.location?.city || "City not added"},{" "}
              {item.location?.state || "State not added"}
            </Text>

            <Text className="mt-2 text-gray-600">
              {item.bio || "No bio added yet."}
            </Text>

            <Text className="mt-3 font-semibold text-black">
              Rating: {item.rating ?? 0} ({item.reviewCount ?? 0} reviews)
            </Text>

          </View>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}