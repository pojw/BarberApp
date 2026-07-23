import { useCallback, useState ,useEffect} from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput,
  Image,
  RefreshControl
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { SafeAreaView } from "react-native-safe-area-context";
import {router, useFocusEffect } from "expo-router";
import { Feather, Ionicons } from "@expo/vector-icons";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  deleteDoc,
serverTimestamp,
updateDoc
} from "firebase/firestore";
import {
  createClientNote,
  deleteClientNote,
  getClientNotes,
  setClientNoteFavorite,
  updateClientNote,
} from "../../../services/clientNotesService";
import {
  listenToUnreadNotificationCount,
} from "../../../services/notificationService";
import { auth, db } from "../../../config/firebase";
import {
  isUpcomingOrToday,
  sortBookingsByDateTime,
} from "../../../utils/dateHelpers";

const HOME_CACHE_KEY_PREFIX = "clientHomeCache";

function getHomeCacheKey(uid) {
  return `${HOME_CACHE_KEY_PREFIX}:${uid}`;
}

async function getLocalBarbers() {
  const barbersRef = collection(db, "barbers");
  const barbersSnap = await getDocs(barbersRef);


  return barbersSnap.docs.map((barberDoc) => ({
    id: barberDoc.id,
    ...barberDoc.data(),
  }));
}
function AiChatSection() {
  return (
    <Pressable
      onPress={() => router.push("/client/aiChat")}
      className="mr-2 px-4 py-3 items-center justify-center rounded-xl bg-app-primary active:bg-app-primary-pressed"
    >
      <Text className="text-center  text-sm font-bold text-app-text-inverse">
        AI Hair Assistant
      </Text>
    </Pressable>
  );
}

function HairProfileBenefitCard({ hasHairProfile }) {
  return (
    <Pressable
      onPress={() =>
        router.push(
          hasHairProfile
            ? "/client/hairProfile"
            : "/client/hairProfile/uploadProfile"
        )
      }
      className="mr-2 px-4 py-3 items-center justify-center rounded-xl bg-app-primary active:bg-app-primary-pressed"
    >
      <Text className="text-center text-sm font-bold text-app-text-inverse">
        {hasHairProfile ? "View Hair Profile" : "Learn Your Hair Profile"}
      </Text>
    </Pressable>
  );
}

function StyleIdeasBenefitCard() {
  return (
    <Pressable
      onPress={() => router.push("/client/styles")}
      className="mr-2 px-4 py-3 items-center justify-center rounded-xl bg-app-primary active:bg-app-primary-pressed"
    >
      <Text className="text-center text-sm font-bold text-app-text-inverse">
        Style Ideas
      </Text>
    </Pressable>
  );
}

function MyBookingsBenefitCard() {
  return (
    <Pressable
      onPress={() => router.push("/client/bookings")}
      className="mr-2 items-center justify-center rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
    >
      <Text className="text-center text-sm font-bold text-app-text-inverse">
        MyBookings
      </Text>
    </Pressable>
  );
}

function PersonalBenefitsSection({ hasHairProfile }) {
  return (
    <View className="mt-8">
      <Text className="text-lg font-semibold text-app-text">
        Personal Benefits
      </Text>

      <View className="mt-3 rounded-2xl border border-app-border-subtle bg-app-surface-elevated p-3">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 8 }}
        >
          <AiChatSection />
          <HairProfileBenefitCard hasHairProfile={hasHairProfile} />
          <MyBookingsBenefitCard />
          <StyleIdeasBenefitCard />
        </ScrollView>
      </View>
    </View>
  );
}
function HomeHeader({ unreadNotificationCount }) {
  const badgeText =
    unreadNotificationCount > 9
      ? "9+"
      : String(unreadNotificationCount);

  return (
    <View className="flex-row items-start justify-between">
      <Text className="text-3xl font-bold text-app-text">
        Cut<Text className="text-app-primary">Care</Text>
      </Text>

      <Pressable
        onPress={() => {
          router.push("/client/notifications");
        }}
        className="relative  p-2 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
      >
        <Ionicons
          name="notifications-outline"
          size={28}
          color="#0B1F3A"
        />

        {unreadNotificationCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#0EA5E9",
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 5,
            }}
          >
            <Text
              style={{
                color: "#ffffff",
                fontSize: 11,
                fontWeight: "700",
              }}
            >
              {badgeText}
            </Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}
function NextBookingCard({ booking }) {
  if (!booking) {
    return (
      <View className="rounded-2xl border border-app-border bg-app-surface p-4">
        <Text className="text-lg font-semibold text-app-text">
          No upcoming bookings
        </Text>

        <Text className="mt-2 text-sm text-app-text-secondary">
          When you book with a barber, your next appointment will show here.
        </Text>

        <Pressable
          onPress={() => router.push("/client/search")}
          className="mt-4 rounded-xl bg-app-primary px-4 py-3 active:bg-app-primary-pressed"
        >
          <Text className="text-center font-semibold text-app-text-inverse">
            Find a Barber
          </Text>
        </Pressable>
      </View>
    );
  }

  const barberDisplayName =
    booking.businessName ||
    booking.barberName ||
    "Your barber";

  const servicesText = Array.isArray(booking.services)
    ? booking.services.map((service) => service.name).join(", ")
    : "Services not listed";

  return (
    <Pressable
      onPress={() => router.push("/client/bookings")}
      className="rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-center">
        <View className="mr-4 h-16 w-16 items-center justify-center rounded-full bg-app-primary-soft">
          <View className="relative px-4 items-center justify-center">
            <Feather
              name="calendar"
              size={30}
              color="#0B1F3A"
            />
            <Feather
              name="clock"
              size={15}
              color="#0B1F3A"
              style={{
                position: "absolute",
                bottom: 0,
                right: 0,
                backgroundColor: "#E8F2FF",
                borderRadius: 8,
              }}
            />
          </View>
        </View>

        <View className="flex-1">
          <Text className="text-sm font-medium text-app-text-muted">
            Next Booking
          </Text>

          <Text className="mt-1 text-xl font-bold text-app-text">
            {barberDisplayName}
          </Text>

          <Text className="mt-2 text-sm text-app-text-secondary">
            {booking.appointmentDate} • {booking.startTime} - {booking.endTime}
          </Text>

          <Text className="mt-2 text-sm text-app-text-secondary">
            {servicesText}
          </Text>

          <View className="mt-3 self-start rounded-full bg-app-primary px-3 py-1">
            <Text className="text-xs font-semibold uppercase text-app-text-inverse">
              {booking.status}
            </Text>
          </View>
        </View>

        <Ionicons
          name="chevron-forward"
          size={28}
          color="#52657A"
        />
      </View>
    </Pressable>
  );
}

function getUniqueBarbersFromBookings(bookings) {
  const barberMap = {};

  bookings.forEach((booking) => {
    if (!booking.barberId) {
      return;
    }

    barberMap[booking.barberId] = {
      id: booking.barberId,
      barberName: booking.barberName || "",
      businessName: booking.businessName || "",
    };
  });

  return Object.values(barberMap);
}

function mergeBookedBarbersWithProfiles(bookedBarbers, localBarbers) {
  const localBarberMap = {};

  localBarbers.forEach((barber) => {
    localBarberMap[barber.id] = barber;
  });

  return bookedBarbers.map((barber) => ({
    ...barber,
    ...(localBarberMap[barber.id] || {}),
  }));
}

function getBarberImageUrl(barber) {
  if (barber.profileImageUrl) {
    return barber.profileImageUrl;
  }

  if (Array.isArray(barber.portfolioImages)) {
    return barber.portfolioImages[0]?.url || "";
  }

  return "";
}

function MyBarberCard({ barber }) {
  const displayName =
    barber.businessName ||
    barber.barberName ||
    "Barber";
  const imageUrl = getBarberImageUrl(barber);

  return (
  <View  style={{ width: 200, height: 150 }} className="mr-4 overflow-hidden rounded-2xl border border-app-border bg-app-surface items-center">
  {imageUrl ? (
    <Image
      source={{ uri: imageUrl }}
      className="absolute inset-0 h-full w-full"
      resizeMode="cover"
      blurRadius={10}
    />
  ) : (
    <View className="absolute inset-0 items-center justify-center bg-app-surface-elevated">
      <Text className="text-7xl font-bold text-app-text-muted">
        {displayName.charAt(0).toUpperCase()}
      </Text>
    </View>
  )}

  <View className="absolute inset-0 bg-app-background opacity-40" />

  <View className="flex-1 w-full items-center justify-end mb-2 ">
    <View className="mb-1  h-20 w-20 overflow-hidden rounded-full border-0 bg-app-primary-soft">
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="h-full w-full"
          resizeMode="cover"
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="text-3xl font-bold text-app-text">
            {displayName.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
    </View>

    <Text
      numberOfLines={1}
      className="text-center text-lg font-bold text-app-text-inverse"
    >
      {displayName}
    </Text>

  <Pressable
  onPress={() => router.push(`/client/barber/${barber.id}`)}
  style={{
    width: 100 ,
    height: 38,
  }}
  className=" items-center  justify-center self-center rounded-xl bg-app-primary active:bg-app-primary-pressed"
>
  <Text className="text-center text-base font-bold text-app-text-inverse">
    Book
  </Text>
</Pressable>
  </View>
</View>
  );
}

function MyBarbersSection({ myBarbers }) {
  return (
    <View className="mt-4">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-app-text">
          My Barbers
        </Text>

        <Pressable onPress={() => router.push("/client/search")}>
          <Text className="text-sm font-semibold text-app-primary">
            Find Barbers
          </Text>
        </Pressable>
      </View>

      {myBarbers.length === 0 ? (
        <View className="mt-3 rounded-2xl border border-app-border bg-app-surface p-4">
          <Text className="text-base font-semibold text-app-text">
            No barbers yet
          </Text>

          <Text className="mt-2 text-sm text-app-text-secondary">
            Book with a barber and they’ll show up here for quick access.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
          contentContainerStyle={{ paddingRight: 20 }}
        >
          {myBarbers.map((barber) => (
            <MyBarberCard key={barber.id} barber={barber} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
function getVisibleNotes(notes, notesSort) {
  if (notesSort === "favorites") {
    return notes.filter((note) => note.isFavorite);
  }

  return notes;
}
function NoteRow({
  note,
  onPress,
  onEdit,
  onToggleFavorite,
  onDelete,
}) {
  const barberDisplayName =
    note.businessName ||
    note.barberName ||
    "General note";
  const notePreview =
    note.body?.trim() ||
    "No note details added yet.";

  return (
    <Pressable
      onPress={() => onPress(note)}
      className="rounded-2xl border border-app-border bg-app-surface p-4 active:bg-app-surface-elevated"
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 pr-3">
          <Text
            numberOfLines={1}
            className="text-base font-semibold text-app-text"
          >
            {note.title || "Untitled note"}
          </Text>

          <Text
            numberOfLines={1}
            className="mt-1 text-sm text-app-text-muted"
          >
            {barberDisplayName}
          </Text>
        </View>

        <Pressable onPress={() => onToggleFavorite(note)}>
          <Text
            className={
              note.isFavorite
                ? "text-xl text-app-primary"
                : "text-xl text-app-text-muted"
            }
          >
            {note.isFavorite ? "★" : "☆"}
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row items-center justify-between">
        <Text
          numberOfLines={1}
          className="flex-1 pr-4 text-sm text-app-text-secondary"
        >
          {notePreview}
        </Text>

        <View className="flex-row gap-3">
          <Pressable onPress={() => onEdit(note)}>
            <Text className="text-sm font-semibold text-app-primary">
              Edit
            </Text>
          </Pressable>

          <Pressable onPress={() => onDelete(note)}>
            <Text className="text-sm font-semibold text-app-text-muted">
              Delete
            </Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}
function PreviousNotesSection({
  notes,
  notesSort,
  onChangeSort,
  onAddNote,
  onOpenNote,
  onEditNote,
  onToggleFavorite,
  onDeleteNote,
}) {
  const visibleNotes = getVisibleNotes(notes, notesSort);

  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-app-text">
          Previous Notes
        </Text>

       <Pressable onPress={onAddNote}>

          <Text className="text-sm font-semibold text-app-primary">
            Add Note
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => onChangeSort("recent")}
          className={`rounded-full border px-4 py-2 ${
            notesSort === "recent" ? "border-app-primary bg-app-primary" : "border-app-border bg-app-surface"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              notesSort === "recent" ? "text-app-text-inverse" : "text-app-text-secondary"
            }`}
          >
            Recent
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeSort("favorites")}
          className={`rounded-full border px-4 py-2 ${
            notesSort === "favorites" ? "border-app-primary bg-app-primary" : "border-app-border bg-app-surface"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              notesSort === "favorites" ? "text-app-text-inverse" : "text-app-text-secondary"
            }`}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

 <View
  className="mt-3 rounded-2xl border border-app-border-subtle bg-app-surface-elevated p-3"
  style={{ height: 260 }}
>
  {visibleNotes.length === 0 ? (
    <View className="p-2">
      <Text className="text-base font-semibold text-app-text">
        {notesSort === "favorites"
          ? "No favorite notes yet"
          : "No notes yet"}
      </Text>

      <Text className="mt-2 text-sm text-app-text-secondary">
        {notesSort === "favorites"
          ? "Favorite notes will show here for quick access."
          : "Save haircut reminders here, like what to ask for next time or what a barber did well."}
      </Text>
    </View>
  ) : (
    <ScrollView
      nestedScrollEnabled
      showsVerticalScrollIndicator
      style={{ flex: 1 }}
      contentContainerStyle={{ gap: 12 }}
    >
      {visibleNotes.map((note) => (
       <NoteRow
  key={note.id}
  note={note}
  onPress={onOpenNote}
  onEdit={onEditNote}
  onToggleFavorite={onToggleFavorite}
  onDelete={onDeleteNote}
/>
      ))}
    </ScrollView>
  )}
</View>
</View>
  );
}
function NoteModal({
  visible,
  editingNote,
  noteTitle,
  noteBody,
  selectedBarberId,
  noteIsFavorite,
  myBarbers,
  onChangeTitle,
  onChangeBody,
  onSelectBarber,
  onToggleFavorite,
  onClose,
  onSave,
  saving,
    formError

}) {
  const isEditing = Boolean(editingNote);

  return (
    <Modal
      visible={visible}
      animationType="slide"
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
    className="max-h-[85%] w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
  >
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-app-text">
              {isEditing ? "Edit Note" : "Add Note"}
            </Text>

            <Pressable onPress={onClose}>
              <Text className="text-base font-semibold text-app-text-secondary">
                Close
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="mt-5"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mb-2 text-sm font-semibold text-app-text-secondary">
              Title
            </Text>

            <TextInput
              value={noteTitle}
              onChangeText={onChangeTitle}
              placeholder="Example: Ask for lower taper"
              placeholderTextColor="#78909A"
              className="rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-app-text"
            />
            {formError ? (
  <Text className="mt-2 text-sm font-medium text-app-error">
    {formError}
  </Text>
) : null}

            <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
              Optional Barber
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
            >
              <Pressable
                onPress={() => onSelectBarber(null)}
                className={`mr-2 rounded-full border px-4 py-2 ${
                  selectedBarberId === null
                    ? "border-app-primary bg-app-primary"
                    : "border-app-border bg-app-background-soft"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedBarberId === null
                      ? "text-app-text-inverse"
                      : "text-app-text-secondary"
                  }`}
                >
                  None
                </Text>
              </Pressable>

              {myBarbers.map((barber) => {
                const barberName =
                  barber.businessName ||
                  barber.barberName ||
                  "Barber";

                const isSelected = selectedBarberId === barber.id;

                return (
                  <Pressable
                    key={barber.id}
                    onPress={() => onSelectBarber(barber.id)}
                    className={`mr-2 rounded-full border px-4 py-2 ${
                      isSelected
                        ? "border-app-primary bg-app-primary"
                        : "border-app-border bg-app-background-soft"
                    }`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`max-w-[140px] text-sm font-semibold ${
                        isSelected ? "text-app-text-inverse" : "text-app-text-secondary"
                      }`}
                    >
                      {barberName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text className="mb-2 mt-5 text-sm font-semibold text-app-text-secondary">
              Body
            </Text>

            <TextInput
              value={noteBody}
              onChangeText={onChangeBody}
              placeholder="Write what you want to remember for your next cut..."
              placeholderTextColor="#78909A"
              multiline
              textAlignVertical="top"
              className="min-h-32 rounded-2xl border border-app-border bg-app-background-soft px-4 py-3 text-app-text"
            />

            <Pressable
              onPress={onToggleFavorite}
              className="mt-5 flex-row items-center rounded-2xl border border-app-border bg-app-background-soft p-4"
            >
              <Text
                className={
                  noteIsFavorite
                    ? "mr-3 text-xl text-app-primary"
                    : "mr-3 text-xl text-app-text-muted"
                }
              >
                {noteIsFavorite ? "★" : "☆"}
              </Text>

              <Text className="text-base font-semibold text-app-text">
                {noteIsFavorite
                  ? "Favorited"
                  : "Mark as favorite"}
              </Text>
            </Pressable>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 rounded-xl border border-app-border px-4 py-3"
              >
                <Text className="text-center font-semibold text-app-text-secondary">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
  onPress={saving ? undefined : onSave}
  className={`flex-1 rounded-xl px-4 py-3 ${
    saving ? "bg-app-disabled" : "bg-app-primary active:bg-app-primary-pressed"
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
    </Modal>
  );
}
export default function ClientHomeScreen() {
  const [userData, setUserData] = useState(null);
  const [clientData, setClientData] = useState(null);
const [
  unreadNotificationCount,
  setUnreadNotificationCount,
] = useState(0);
  const [nextUpcomingBooking, setNextUpcomingBooking] = useState(null);
  const [myBarbers, setMyBarbers] = useState([]);
  const [localBarbers, setLocalBarbers] = useState([]);
  const [notes, setNotes] = useState([]);
const [notesSort, setNotesSort] = useState("recent");

const [noteModalVisible, setNoteModalVisible] = useState(false);
const [editingNote, setEditingNote] = useState(null);

const [noteTitle, setNoteTitle] = useState("");
const [noteBody, setNoteBody] = useState("");
const [selectedBarberId, setSelectedBarberId] = useState(null);
const [noteIsFavorite, setNoteIsFavorite] = useState(false);
const [savingNote, setSavingNote] = useState(false);
const [noteFormError, setNoteFormError] = useState("");

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
useEffect(() => {
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    const resetTimer = setTimeout(() => {
      setUnreadNotificationCount(0);
    }, 0);

    return () => clearTimeout(resetTimer);
  }

  const unsubscribe =
    listenToUnreadNotificationCount(
      currentUser.uid,
      (count) => {
        setUnreadNotificationCount(count);
      },
      (error) => {
        console.log(
          "Listen to notification badge error:",
          error
        );

        setUnreadNotificationCount(0);
      }
    );

  return () => unsubscribe();
}, []);

  const loadCachedHomeData = useCallback(async (uid) => {
    try {
      const cachedHomeData = await AsyncStorage.getItem(
        getHomeCacheKey(uid)
      );

      if (!cachedHomeData) {
        return false;
      }

      const parsedCache = JSON.parse(cachedHomeData);

      setUserData(parsedCache.userData || null);
      setClientData(parsedCache.clientData || null);
      setNextUpcomingBooking(parsedCache.nextUpcomingBooking || null);
      setMyBarbers(parsedCache.myBarbers || []);
      setLocalBarbers(parsedCache.localBarbers || []);
      setNotes(parsedCache.notes || []);

      return true;
    } catch (err) {
      console.log("Load cached client home error:", err);
      return false;
    }
  }, []);

  const saveHomeCache = useCallback(async ({
    uid,
    loadedUserData,
    loadedClientData,
    nextBooking,
    pastOrCurrentBarbers,
    allBarbers,
    loadedNotes,
  }) => {
    try {
      await AsyncStorage.setItem(
        getHomeCacheKey(uid),
        JSON.stringify({
          userData: loadedUserData,
          clientData: loadedClientData,
          nextUpcomingBooking: nextBooking,
          myBarbers: pastOrCurrentBarbers,
          localBarbers: allBarbers,
          notes: loadedNotes,
          cachedAt: Date.now(),
        })
      );
    } catch (err) {
      console.log("Save client home cache error:", err);
    }
  }, []);

  const loadHomeData = useCallback(async ({
    showLoader = true,
    useCache = false,
    showErrorOnFailure = true,
  } = {}) => {
    let hasCachedData = false;

    try {
      if (showLoader) {
        setLoading(true);
      }
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You must be logged in to view home.");
        return;
      }

      const uid = currentUser.uid;

      if (useCache) {
        hasCachedData = await loadCachedHomeData(uid);

        if (hasCachedData) {
          setLoading(false);
        }
      }

      const userRef = doc(db, "users", uid);
      const clientRef = doc(db, "clients", uid);

      const bookingsRef = collection(db, "bookings");
      const bookingsQuery = query(
        bookingsRef,
        where("clientId", "==", uid)
      );
     

const [
  userSnap,
  clientSnap,
  bookingsSnap,
  loadedNotes,
  allBarbers,
] = await Promise.all([
  getDoc(userRef),
  getDoc(clientRef),
  getDocs(bookingsQuery),
  getClientNotes(uid),
  getLocalBarbers(),
]);

      const loadedUserData = userSnap.exists()
        ? userSnap.data()
        : null;

      const loadedClientData = clientSnap.exists()
        ? clientSnap.data()
        : null;

      setUserData(loadedUserData);
      setClientData(loadedClientData);

      const bookings = bookingsSnap.docs.map((bookingDoc) => ({
        id: bookingDoc.id,
        ...bookingDoc.data(),
      }));
     
      const activeUpcomingBookings = bookings.filter((booking) => {
        const isActiveStatus =
          booking.status === "pending" || booking.status === "confirmed";

        return (
          isActiveStatus &&
          isUpcomingOrToday(booking.appointmentDate)
        );
      });

      const sortedUpcomingBookings = sortBookingsByDateTime(
        activeUpcomingBookings
      );

      const nextBooking = sortedUpcomingBookings[0] || null;

      const pastOrCurrentBarbers = mergeBookedBarbersWithProfiles(
        getUniqueBarbersFromBookings(bookings),
        allBarbers
      );

    
      setNextUpcomingBooking(nextBooking);
      setMyBarbers(pastOrCurrentBarbers);
      setLocalBarbers(allBarbers);
      setNotes(loadedNotes);

      await saveHomeCache({
        uid,
        loadedUserData,
        loadedClientData,
        nextBooking,
        pastOrCurrentBarbers,
        allBarbers,
        loadedNotes,
      });
    } catch (err) {
      console.log("Error loading client home:", err);
      if (showErrorOnFailure && !hasCachedData) {
        setError("Failed to load home. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [loadCachedHomeData, saveHomeCache]);

  useFocusEffect(
    useCallback(() => {
      loadHomeData({
        showLoader: true,
        useCache: true,
      });
    }, [loadHomeData])
  );

const handleRefresh = useCallback(async () => {
  setRefreshing(true);
  await loadHomeData({
    showLoader: false,
    showErrorOnFailure: false,
  });
  setRefreshing(false);
}, [loadHomeData]);

 const openCreateNoteModal = () => {
  setEditingNote(null);
  setNoteTitle("");
  setNoteBody("");
  setSelectedBarberId(null);
  setNoteIsFavorite(false);
  setNoteFormError("");
  setNoteModalVisible(true);
};

const openEditNoteModal = (note) => {
  setEditingNote(note);
  setNoteTitle(note.title || "");
  setNoteBody(note.body || "");
  setSelectedBarberId(note.barberId || null);
  setNoteIsFavorite(Boolean(note.isFavorite));
  setNoteFormError("");
  setNoteModalVisible(true);
};
const handleSaveNote = async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "You must be logged in to save notes."
      );
      return;
    }

    const trimmedTitle = noteTitle.trim();
    const trimmedBody = noteBody.trim();

    if (!trimmedTitle) {
      setNoteFormError(
        "Note title is required."
      );
      return;
    }

    setSavingNote(true);
    setError("");
    setNoteFormError("");

    const selectedBarber = myBarbers.find(
      (barber) =>
        barber.id === selectedBarberId
    );

    const noteData = {
      clientId: currentUser.uid,
      title: trimmedTitle,
      body: trimmedBody,
      barberId: selectedBarber?.id || null,
      barberName:
        selectedBarber?.barberName || "",
      businessName:
        selectedBarber?.businessName || "",
      isFavorite: noteIsFavorite,
    };

    if (editingNote) {
      await updateClientNote({
        ...noteData,
        noteId: editingNote.id,
      });
    } else {
      await createClientNote(noteData);
    }

    closeNoteModal();
    await loadNotesOnly();
  } catch (err) {
    console.log(
      "Error saving note:",
      err
    );

    setError(
      "Failed to save note. Please try again."
    );
  } finally {
    setSavingNote(false);
  }
};
const handleToggleFavoriteNote = async (
  note
) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "You must be logged in to update notes."
      );
      return;
    }

    await setClientNoteFavorite({
      clientId: currentUser.uid,
      noteId: note.id,
      isFavorite: !note.isFavorite,
    });

    await loadNotesOnly();
  } catch (err) {
    console.log(
      "Error toggling note favorite:",
      err
    );

    setError(
      "Failed to update note. Please try again."
    );
  }
};
const loadNotesOnly = useCallback(async () => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return;
    }

    const uid = currentUser.uid;

    const loadedNotes = await getClientNotes(
      currentUser.uid
    );

    setNotes(loadedNotes);
  } catch (err) {
    console.log("Error loading notes:", err);
    setError("Failed to load notes. Please try again.");
  }
}, []);
const handleDeleteNote = async (
  note
) => {
  try {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError(
        "You must be logged in to delete notes."
      );
      return;
    }

    await deleteClientNote({
      clientId: currentUser.uid,
      noteId: note.id,
    });

    if (editingNote?.id === note.id) {
      closeNoteModal();
    }

    await loadNotesOnly();
  } catch (err) {
    console.log(
      "Error deleting note:",
      err
    );

    setError(
      "Failed to delete note. Please try again."
    );
  }
};
const closeNoteModal = () => {
  setNoteFormError("");
  setNoteModalVisible(false);
};
  const displayName =
    clientData?.preferredName ||
    userData?.fullName ||
    clientData?.fullName ||
    "there";
  const hasHairProfile =
    clientData?.aiHairProfile?.hasConfirmedProfile === true &&
    Boolean(clientData?.aiHairProfile?.activeProfileId);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-app-text-muted">Loading home...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-app-background items-center justify-center px-6">
        <Text className="text-app-error text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
  <SafeAreaView className="flex-1 bg-app-background">
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-6 py-6"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#1677FF"
          colors={["#1677FF"]}
        />
      }
    >
<HomeHeader
  unreadNotificationCount={unreadNotificationCount}
/>
      <MyBarbersSection myBarbers={myBarbers} />

      <View  className="mt-8 ">
        <Text className="mb-3 text-lg font-semibold text-app-text">
          Next Booking
        </Text>

        <NextBookingCard booking={nextUpcomingBooking} />
      </View>

     <PreviousNotesSection
  notes={notes}
  notesSort={notesSort}
  onChangeSort={setNotesSort}
  onAddNote={openCreateNoteModal}
  onOpenNote={openEditNoteModal}
  onEditNote={openEditNoteModal}
  onToggleFavorite={handleToggleFavoriteNote}
  onDeleteNote={handleDeleteNote}
></PreviousNotesSection>
<PersonalBenefitsSection hasHairProfile={hasHairProfile} />
    </ScrollView>
    <NoteModal
      visible={noteModalVisible}
      editingNote={editingNote}
      noteTitle={noteTitle}
      noteBody={noteBody}
      selectedBarberId={selectedBarberId}
      noteIsFavorite={noteIsFavorite}
      myBarbers={myBarbers}
      onChangeTitle={setNoteTitle}
      onChangeBody={setNoteBody}
      onSelectBarber={setSelectedBarberId}
      onToggleFavorite={() => setNoteIsFavorite((current) => !current)}
      onClose={closeNoteModal}
      onSave={handleSaveNote}
      saving={savingNote}
        formError={noteFormError}


    />
  </SafeAreaView>
  
);
}
