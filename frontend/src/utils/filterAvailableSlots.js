import { timesOverlap } from "./bookingTime";

const BLOCKING_STATUSES = ["pending", "confirmed"];

export function filterAvailableSlots(candidateSlots, existingBookings) {
  return candidateSlots.filter((slot) => {
    const hasConflict = existingBookings.some((booking) => {
      if (!BLOCKING_STATUSES.includes(booking.status)) {
        return false;
      }

      return timesOverlap(
        slot.startTime,
        slot.endTime,
        booking.startTime,
        booking.endTime
      );
    });

    return !hasConflict;
  });
}