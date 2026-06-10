export function timeToMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
    2,
    "0"
  )}`;
}

export function addMinutesToTime(time, minutesToAdd) {
  const startingMinutes = timeToMinutes(time);
  const endingMinutes = startingMinutes + minutesToAdd;

  return minutesToTime(endingMinutes);
}

export function timesOverlap(
  newStart,
  newEnd,
  existingStart,
  existingEnd
) {
  const newStartMinutes = timeToMinutes(newStart);
  const newEndMinutes = timeToMinutes(newEnd);
  const existingStartMinutes = timeToMinutes(existingStart);
  const existingEndMinutes = timeToMinutes(existingEnd);

  return (
    newStartMinutes < existingEndMinutes &&
    newEndMinutes > existingStartMinutes
  );
}

export function formatTime12Hour(time24) {
  if (!time24 || !time24.includes(":")) {
    return "Time not set";
  }

  const [hourString, minute] = time24.split(":");
  const hour24 = Number(hourString);

  const period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 || 12;

  return `${hour12}:${minute} ${period}`;
}