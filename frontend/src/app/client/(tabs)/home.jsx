import { useCallback, useState ,useEffect} from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  View,
  Pressable,
  Modal,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {router, useFocusEffect } from "expo-router";
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
      className="mt-8 rounded-2xl bg-gray-900 p-5 active:bg-gray-700"
    >
      <Text className="text-lg font-bold text-white">
        AI Hair Assistant
      </Text>

      <Text className="mt-2 text-sm leading-5 text-gray-300">
        Ask about haircut ideas, styling, products, or what to ask your barber.
      </Text>

      <Text className="mt-4 font-semibold text-white">
        Start Chat →
      </Text>
    </Pressable>
  );
}
function HomeHeader({ unreadNotificationCount }) {
  const badgeText =
    unreadNotificationCount > 9
      ? "9+"
      : String(unreadNotificationCount);

  return (
    <View className="flex-row items-center justify-between">
      <Pressable
        onPress={() => {
          router.push("/client/notifications");
        }}
        className="relative h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-gray-50 active:bg-gray-100"
      >
        <Text className="text-xl">🔔</Text>

        {unreadNotificationCount > 0 ? (
          <View
            style={{
              position: "absolute",
              top: -5,
              right: -5,
              minWidth: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: "#000000",
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
      <View className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
        <Text className="text-lg font-semibold text-gray-900">
          No upcoming bookings
        </Text>

        <Text className="mt-2 text-sm text-gray-600">
          When you book with a barber, your next appointment will show here.
        </Text>

        <Pressable
          onPress={() => router.push("/client/search")}
          className="mt-4 rounded-xl bg-gray-900 px-4 py-3 active:bg-gray-700"
        >
          <Text className="text-center font-semibold text-white">
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
      className="rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
    >
      <Text className="text-sm font-medium text-gray-500">
        Next Booking
      </Text>

      <Text className="mt-2 text-xl font-bold text-gray-900">
        {barberDisplayName}
      </Text>

      <Text className="mt-2 text-sm text-gray-700">
        {booking.appointmentDate} • {booking.startTime} - {booking.endTime}
      </Text>

      <Text className="mt-2 text-sm text-gray-700">
        {servicesText}
      </Text>

      <View className="mt-3 self-start rounded-full bg-gray-100 px-3 py-1">
        <Text className="text-xs font-semibold uppercase text-gray-700">
          {booking.status}
        </Text>
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
function MyBarberCard({ barber }) {
  const displayName =
    barber.businessName ||
    barber.barberName ||
    "Barber";

  return (
    <Pressable
      onPress={() => router.push(`/client/barber/${barber.id}`)}
      className="mr-3 w-40 rounded-2xl border border-gray-200 bg-white p-4 active:bg-gray-50"
    >
      <View className="h-14 w-14 items-center justify-center rounded-full bg-gray-100">
        <Text className="text-xl font-bold text-gray-700">
          {displayName.charAt(0).toUpperCase()}
        </Text>
      </View>

      <Text
        numberOfLines={1}
        className="mt-3 text-base font-semibold text-gray-900"
      >
        {displayName}
      </Text>

      <Text className="mt-1 text-xs text-gray-500">
        Previously booked
      </Text>
    </Pressable>
  );
}

function MyBarbersSection({ myBarbers }) {
  return (
    <View className="mt-8">
      <View className="flex-row items-center justify-between">
        <Text className="text-lg font-semibold text-gray-900">
          My Barbers
        </Text>

        <Pressable onPress={() => router.push("/client/search")}>
          <Text className="text-sm font-semibold text-gray-900">
            Find Barbers
          </Text>
        </Pressable>
      </View>

      {myBarbers.length === 0 ? (
        <View className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-4">
          <Text className="text-base font-semibold text-gray-900">
            No barbers yet
          </Text>

          <Text className="mt-2 text-sm text-gray-600">
            Book with a barber and they’ll show up here for quick access.
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
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

  return (
    <View className="rounded-2xl border border-gray-200 bg-white p-4">
      <Pressable
        onPress={() => onPress(note)}
        className="active:bg-gray-50"
      >
        <View className="flex-row items-start justify-between">
          <View className="flex-1 pr-3">
            <Text
              numberOfLines={1}
              className="text-base font-semibold text-gray-900"
            >
              {note.title || "Untitled note"}
            </Text>

            <Text
              numberOfLines={1}
              className="mt-1 text-sm text-gray-500"
            >
              {barberDisplayName}
            </Text>
          </View>

          <Pressable onPress={() => onToggleFavorite(note)}>
            <Text className="text-xl">
              {note.isFavorite ? "★" : "☆"}
            </Text>
          </Pressable>
        </View>
      </Pressable>

      <View className="mt-3 flex-row justify-end gap-3">
        <Pressable onPress={() => onEdit(note)}>
          <Text className="text-sm font-semibold text-gray-700">
            Edit
          </Text>
        </Pressable>

        <Pressable onPress={() => onDelete(note)}>
          <Text className="text-sm font-semibold text-red-500">
            Delete
          </Text>
        </Pressable>
      </View>
    </View>
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
        <Text className="text-lg font-semibold text-gray-900">
          Previous Notes
        </Text>

       <Pressable onPress={onAddNote}>

          <Text className="text-sm font-semibold text-gray-900">
            Add Note
          </Text>
        </Pressable>
      </View>

      <View className="mt-3 flex-row gap-2">
        <Pressable
          onPress={() => onChangeSort("recent")}
          className={`rounded-full px-4 py-2 ${
            notesSort === "recent" ? "bg-gray-900" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              notesSort === "recent" ? "text-white" : "text-gray-700"
            }`}
          >
            Recent
          </Text>
        </Pressable>

        <Pressable
          onPress={() => onChangeSort("favorites")}
          className={`rounded-full px-4 py-2 ${
            notesSort === "favorites" ? "bg-gray-900" : "bg-gray-100"
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              notesSort === "favorites" ? "text-white" : "text-gray-700"
            }`}
          >
            Favorites
          </Text>
        </Pressable>
      </View>

 <View
  className="mt-3 rounded-2xl border border-gray-200 bg-gray-50 p-3"
  style={{ height: 260 }}
>
  {visibleNotes.length === 0 ? (
    <View className="p-2">
      <Text className="text-base font-semibold text-gray-900">
        {notesSort === "favorites"
          ? "No favorite notes yet"
          : "No notes yet"}
      </Text>

      <Text className="mt-2 text-sm text-gray-600">
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
    className="max-h-[85%] w-full rounded-3xl bg-white px-5 pb-6 pt-5"
  >
          <View className="flex-row items-center justify-between">
            <Text className="text-xl font-bold text-gray-900">
              {isEditing ? "Edit Note" : "Add Note"}
            </Text>

            <Pressable onPress={onClose}>
              <Text className="text-base font-semibold text-gray-600">
                Close
              </Text>
            </Pressable>
          </View>

          <ScrollView
            className="mt-5"
            showsVerticalScrollIndicator={false}
          >
            <Text className="mb-2 text-sm font-semibold text-gray-700">
              Title
            </Text>

            <TextInput
              value={noteTitle}
              onChangeText={onChangeTitle}
              placeholder="Example: Ask for lower taper"
              className="rounded-2xl border border-gray-200 px-4 py-3 text-gray-900"
            />
            {formError ? (
  <Text className="mt-2 text-sm font-medium text-red-500">
    {formError}
  </Text>
) : null}

            <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">
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
                    ? "border-gray-900 bg-gray-900"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <Text
                  className={`text-sm font-semibold ${
                    selectedBarberId === null
                      ? "text-white"
                      : "text-gray-700"
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
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-200 bg-gray-50"
                    }`}
                  >
                    <Text
                      numberOfLines={1}
                      className={`max-w-[140px] text-sm font-semibold ${
                        isSelected ? "text-white" : "text-gray-700"
                      }`}
                    >
                      {barberName}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <Text className="mb-2 mt-5 text-sm font-semibold text-gray-700">
              Body
            </Text>

            <TextInput
              value={noteBody}
              onChangeText={onChangeBody}
              placeholder="Write what you want to remember for your next cut..."
              multiline
              textAlignVertical="top"
              className="min-h-32 rounded-2xl border border-gray-200 px-4 py-3 text-gray-900"
            />

            <Pressable
              onPress={onToggleFavorite}
              className="mt-5 flex-row items-center rounded-2xl border border-gray-200 bg-gray-50 p-4"
            >
              <Text className="mr-3 text-xl">
                {noteIsFavorite ? "★" : "☆"}
              </Text>

              <Text className="text-base font-semibold text-gray-900">
                {noteIsFavorite
                  ? "Favorited"
                  : "Mark as favorite"}
              </Text>
            </Pressable>

            <View className="mt-6 flex-row gap-3">
              <Pressable
                onPress={onClose}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-3"
              >
                <Text className="text-center font-semibold text-gray-700">
                  Cancel
                </Text>
              </Pressable>

              <Pressable
  onPress={saving ? undefined : onSave}
  className={`flex-1 rounded-xl px-4 py-3 ${
    saving ? "bg-gray-400" : "bg-gray-900 active:bg-gray-700"
  }`}
>
  <Text className="text-center font-semibold text-white">
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
  const [error, setError] = useState("");
useEffect(() => {
  const currentUser = auth.currentUser;

  if (!currentUser?.uid) {
    setUnreadNotificationCount(0);
    return;
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

  const loadHomeData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const currentUser = auth.currentUser;

      if (!currentUser) {
        setError("You must be logged in to view home.");
        return;
      }

      const uid = currentUser.uid;

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

      if (userSnap.exists()) {
        setUserData(userSnap.data());
      } else {
        setUserData(null);
      }

      if (clientSnap.exists()) {
        setClientData(clientSnap.data());
      } else {
        setClientData(null);
      }

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

      const pastOrCurrentBarbers = getUniqueBarbersFromBookings(bookings);

    
      setNextUpcomingBooking(nextBooking);
      setMyBarbers(pastOrCurrentBarbers);
      setLocalBarbers(allBarbers);
      setNotes(loadedNotes);
    } catch (err) {
      console.log("Error loading client home:", err);
      setError("Failed to load home. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHomeData();
    }, [loadHomeData])
  );

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

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" />
        <Text className="mt-3 text-gray-600">Loading home...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-white items-center justify-center px-6">
        <Text className="text-red-500 text-center">{error}</Text>
      </SafeAreaView>
    );
  }

  return (
  <SafeAreaView className="flex-1 bg-white">
    <ScrollView className="flex-1 px-5 py-4">
<HomeHeader
  unreadNotificationCount={unreadNotificationCount}
/>
  <AiChatSection />
      <MyBarbersSection myBarbers={myBarbers} />

      <View className="mt-8">
        <Text className="mb-3 text-lg font-semibold text-gray-900">
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
  <View>
<Pressable onPress={()=>router.push("/client/hairProfile/")} className="mt-6 rounded-xl">
  <Text>Hair onboardied?</Text>
</Pressable>
</View>
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