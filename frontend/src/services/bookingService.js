import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

export async function getBarberBookingsByDate(
  barberId,
  appointmentDate
) {
  if (!barberId || !appointmentDate) {
    throw new Error("Barber ID and appointment date are required.");
  }

  const bookingsRef = collection(db, "bookings");

  const bookingsQuery = query(
    bookingsRef,
    where("barberId", "==", barberId),
    where("appointmentDate", "==", appointmentDate)
  );

  const bookingsSnapshot = await getDocs(bookingsQuery);

  return bookingsSnapshot.docs.map((bookingDoc) => ({
    id: bookingDoc.id,
    ...bookingDoc.data(),
  }));
}
export async function cancelBooking(bookingId, clientId) {
  if (!bookingId) {
    throw new Error("Booking ID is required.");
  }

  if (!clientId) {
    throw new Error("Client ID is required.");
  }

  const bookingRef = doc(db, "bookings", bookingId);

  await updateDoc(bookingRef, {
    status: "cancelled",
    updatedAt: serverTimestamp(),
  });
}