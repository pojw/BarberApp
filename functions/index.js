const { setGlobalOptions } = require("firebase-functions");
const {
  onDocumentCreated,
} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");

const { initializeApp } = require("firebase-admin/app");
const {
  getFirestore,
  FieldValue,
} = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();

setGlobalOptions({
  maxInstances: 10,
});

exports.createNewBookingNotification = onDocumentCreated(
  "bookings/{bookingId}",
  async (event) => {
    const bookingSnapshot = event.data;

    if (!bookingSnapshot) {
      logger.error("Booking snapshot was missing.");
      return;
    }

    const booking = bookingSnapshot.data();
    const bookingId = event.params.bookingId;

    const {
      barberId,
      clientId,
      clientName,
    } = booking;

    if (!barberId || !clientId) {
      logger.error("Booking is missing required participant IDs.", {
        bookingId,
      });

      return;
    }

    const notificationId =
      `booking_request_${bookingId}`;

    const notificationRef = db.doc(
      `users/${barberId}/notifications/${notificationId}`
    );

    await notificationRef.set({
      type: "new_booking_request",
        title: "New booking request",
      body: `${
        clientName || "A client"
      } requested an appointment.`,
      actorId: clientId,
      isRead: false,
      createdAt: FieldValue.serverTimestamp(),
      data: {
        bookingId,
      },
    });

    logger.info("New booking notification created.", {
      bookingId,
      barberId,
      notificationId,
    });
  }
);