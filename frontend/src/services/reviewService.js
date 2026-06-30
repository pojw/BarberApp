import {
  addDoc,
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";

import { auth, db } from "../config/firebase";

/**
 * Get recent reviews for a specific barber.
 * Used on the barber detail page.
 */
export async function getReviewsForBarber(barberId) {
  if (!barberId) {
    throw new Error("Missing barberId.");
  }

  const reviewsRef = collection(db, "reviews");

  const q = query(
    reviewsRef,
    where("barberId", "==", barberId),
    orderBy("createdAt", "desc"),
    limit(10)
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

/**
 * Check if a review already exists for a booking.
 * Used on the client bookings page.
 */
export async function getReviewForBooking(bookingId) {
  if (!bookingId) {
    throw new Error("Missing bookingId.");
  }

  const reviewsRef = collection(db, "reviews");

  const q = query(
    reviewsRef,
    where("bookingId", "==", bookingId),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    return null;
  }

  const reviewDoc = snapshot.docs[0];

  return {
    id: reviewDoc.id,
    ...reviewDoc.data(),
  };
}

/**
 * Recalculate the barber's average rating and review count.
 * MVP version: query all reviews for this barber and average them.
 */
export async function calculateBarberRating(barberId) {
  if (!barberId) {
    throw new Error("Missing barberId.");
  }

  const reviewsRef = collection(db, "reviews");

  const q = query(
    reviewsRef,
    where("barberId", "==", barberId)
  );

  const snapshot = await getDocs(q);

  const reviews = snapshot.docs.map((docSnap) => docSnap.data());

  const reviewCount = reviews.length;

  const ratingTotal = reviews.reduce((sum, review) => {
    return sum + Number(review.rating || 0);
  }, 0);

  const averageRating =
    reviewCount > 0 ? ratingTotal / reviewCount : 0;

  const roundedRating = Number(averageRating.toFixed(1));

  const barberRef = doc(db, "barbers", barberId);

  await updateDoc(barberRef, {
    rating: roundedRating,
    reviewCount,
    updatedAt: serverTimestamp(),
  });

  return {
    rating: roundedRating,
    reviewCount,
  };
}

/**
 * Create a review for a completed booking.
 * This protects the main MVP rules on the frontend/service layer.
 */
export async function createReview({ booking, rating, comment }) {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("You must be logged in to leave a review.");
  }

  if (!booking) {
    throw new Error("Missing booking.");
  }

  if (!booking.id) {
    throw new Error("Missing booking id.");
  }

  if (booking.status !== "completed") {
    throw new Error("Only completed bookings can be reviewed.");
  }

  if (booking.clientId !== currentUser.uid) {
    throw new Error("You can only review your own bookings.");
  }

  const numericRating = Number(rating);

  if (!numericRating || numericRating < 1 || numericRating > 5) {
    throw new Error("Please select a rating from 1 to 5.");
  }

  const existingReview = await getReviewForBooking(booking.id);

  if (existingReview) {
    throw new Error("This booking has already been reviewed.");
  }

  const reviewsRef = collection(db, "reviews");

  const reviewData = {
    bookingId: booking.id,
    clientId: booking.clientId,
    barberId: booking.barberId,

    clientName: booking.clientName || "",
    barberName: booking.barberName || "",
    businessName: booking.businessName || "",

    rating: numericRating,
    comment: comment?.trim() || "",

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const reviewDoc = await addDoc(reviewsRef, reviewData);

  await calculateBarberRating(booking.barberId);

  return {
    id: reviewDoc.id,
    ...reviewData,
  };
}