import {
  addMinutesToTime,
  timeToMinutes,
} from "./bookingTime";

export function generateBookingSlots(
  startTime,
  endTime,
  durationMinutes,
  intervalMinutes = 15
) {
  const slots = [];

  const openingMinutes = timeToMinutes(startTime);
  const closingMinutes = timeToMinutes(endTime);

  let currentStartMinutes = openingMinutes;

  while (currentStartMinutes + durationMinutes <= closingMinutes) {
    const slotStart = addMinutesToTime(
      startTime,
      currentStartMinutes - openingMinutes
    );

    const slotEnd = addMinutesToTime(
      slotStart,
      durationMinutes
    );

    slots.push({
      startTime: slotStart,
      endTime: slotEnd,
    });

    currentStartMinutes += intervalMinutes;
  }

  return slots;
}