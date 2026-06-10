import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../config/firebase";
import { getBarberBookingsByDate } from "./bookingService";
import { timesOverlap } from "../utils/bookingTime";


export async function createBooking(bookingData) {
     const BLOCKING_STATUSES = ["pending", "confirmed"];

  const {
    barberId,
    appointmentDate,
    startTime,
    endTime,
  } = bookingData;

  if (!barberId) {
    throw new Error("Barber ID is required.");
  }

  if (!appointmentDate || !startTime || !endTime) {
    throw new Error("Appointment date and time are required.");
  }

  const existingBookings = await getBarberBookingsByDate(
    barberId,
    appointmentDate
  );

  const hasConflict = existingBookings.some((booking) => {
    if (!BLOCKING_STATUSES.includes(booking.status)) {
      return false;
    }

    return timesOverlap(
      startTime,
      endTime,
      booking.startTime,
      booking.endTime
    );
  });

  if (hasConflict) {
    throw new Error(
      "This appointment time is no longer available."
    );
  }

  const bookingsRef = collection(db, "bookings");

  const bookingRef = await addDoc(bookingsRef, {
    ...bookingData,
    status: "pending",
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return bookingRef.id;
}
