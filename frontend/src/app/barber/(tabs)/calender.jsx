import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import { auth } from "../../../config/firebase";
import { getBookingsForBarber } from "../../../services/bookingService";
import {
  formatTime12Hour,
  timeToMinutes,
} from "../../../utils/bookingTime";

const HOUR_ROWS = Array.from({ length: 15 }, (_, index) => index + 6);
const REPEAT_OPTIONS = [
  { label: "One time", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
];
const EVENT_COLORS = {
  booking: {
    label: "Clients",
    background: "#E8F2FF",
    border: "#1677FF",
    text: "#0B1F3A",
  },
  school: {
    label: "School",
    background: "#EEF2FF",
    border: "#6366F1",
    text: "#1E1B4B",
  },
  bjj: {
    label: "BJJ",
    background: "#ECFDF3",
    border: "#22A06B",
    text: "#064E3B",
  },
  personal: {
    label: "Personal",
    background: "#FFF7E8",
    border: "#E69B19",
    text: "#5F3B00",
  },
  blocked: {
    label: "Blocked",
    background: "#F3F7FB",
    border: "#8292A6",
    text: "#0B1F3A",
  },
};

function getTodayDateString() {
  const today = new Date();

  return formatDateKey(today);
}

function formatDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function parseDateKey(dateKey) {
  const [year, month, day] = dateKey.split("-").map(Number);

  return new Date(year, month - 1, day);
}

function addDays(dateKey, amount) {
  const date = parseDateKey(dateKey);
  date.setDate(date.getDate() + amount);

  return formatDateKey(date);
}

function getWeekDates(anchorDateKey) {
  const anchorDate = parseDateKey(anchorDateKey);
  const dayIndex = anchorDate.getDay();
  const sunday = new Date(anchorDate);
  sunday.setDate(anchorDate.getDate() - dayIndex);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(sunday.getDate() + index);

    return formatDateKey(date);
  });
}

function formatHeaderDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDayName(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "short",
  });
}

function getHourLabel(hour) {
  return formatTime12Hour(`${String(hour).padStart(2, "0")}:00`);
}

function getServicesText(booking) {
  if (!Array.isArray(booking.services) || booking.services.length === 0) {
    return "No services listed";
  }

  return booking.services
    .map((service) => service.name)
    .filter(Boolean)
    .join(", ");
}

function buildBookingEvent(booking) {
  return {
    id: `booking-${booking.id}`,
    sourceId: booking.id,
    type: "booking",
    title: booking.clientName || "Client",
    subtitle: getServicesText(booking),
    note: booking.clientNotes || "",
    date: booking.appointmentDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
    colorKey: "booking",
    repeatRule: "none",
  };
}

function doesRepeatingEventLandOnDate(event, dateKey) {
  if (event.date === dateKey) {
    return true;
  }

  if (!event.repeatRule || event.repeatRule === "none") {
    return false;
  }

  const eventDate = parseDateKey(event.date);
  const targetDate = parseDateKey(dateKey);

  if (targetDate < eventDate) {
    return false;
  }

  if (event.repeatRule === "daily") {
    return true;
  }

  return event.repeatRule === "weekly" &&
    eventDate.getDay() === targetDate.getDay();
}

function normalizePersonalEvent(event, dateKey) {
  return {
    ...event,
    id: `${event.id}-${dateKey}`,
    sourceId: event.id,
    date: dateKey,
  };
}

function getEventStartHour(event) {
  if (!event.startTime || !event.startTime.includes(":")) {
    return null;
  }

  return Math.floor(timeToMinutes(event.startTime) / 60);
}

function getEventsForSlot(events, dateKey, hour) {
  return events.filter((event) => {
    const startHour = getEventStartHour(event);

    return event.date === dateKey && startHour === hour;
  });
}

function getEventColor(event) {
  return EVENT_COLORS[event.colorKey] || EVENT_COLORS.personal;
}

function EventBlock({ event }) {
  const color = getEventColor(event);

  return (
    <View
      style={{
        backgroundColor: color.background,
        borderColor: color.border,
      }}
      className="mb-2 rounded-xl border px-3 py-2"
    >
      <Text
        style={{ color: color.text }}
        className="text-xs font-bold"
      >
        {event.title}
      </Text>

      <Text className="mt-1 text-xs text-app-text-secondary">
        {formatTime12Hour(event.startTime)} -{" "}
        {formatTime12Hour(event.endTime)}
      </Text>

      {event.subtitle ? (
        <Text className="mt-1 text-xs text-app-text-muted">
          {event.subtitle}
        </Text>
      ) : null}

      {event.note ? (
        <Text className="mt-1 text-xs font-medium text-app-text-secondary">
          {event.note}
        </Text>
      ) : null}
    </View>
  );
}

function CalendarDayColumn({ dateKey, events, compact = false }) {
  const isToday = dateKey === getTodayDateString();

  return (
    <View
      style={{ width: compact ? 148 : undefined }}
      className={compact ? "mr-3" : "flex-1"}
    >
      <View
        className={
          isToday
            ? "mb-2 rounded-xl bg-app-primary px-3 py-2"
            : "mb-2 rounded-xl bg-app-surface-elevated px-3 py-2"
        }
      >
        <Text
          className={
            isToday
              ? "text-center text-xs font-bold text-app-text-inverse"
              : "text-center text-xs font-bold text-app-text-secondary"
          }
        >
          {formatDayName(dateKey)}
        </Text>

        <Text
          className={
            isToday
              ? "text-center text-sm font-bold text-app-text-inverse"
              : "text-center text-sm font-bold text-app-text"
          }
        >
          {formatHeaderDate(dateKey)}
        </Text>
      </View>

      {HOUR_ROWS.map((hour) => {
        const slotEvents = getEventsForSlot(events, dateKey, hour);

        return (
          <View
            key={`${dateKey}-${hour}`}
            className="min-h-20 border-t border-app-border-subtle py-2"
          >
            {slotEvents.map((event) => (
              <EventBlock key={event.id} event={event} />
            ))}
          </View>
        );
      })}
    </View>
  );
}

function ColorChip({ colorKey, selected, onPress }) {
  const color = EVENT_COLORS[colorKey];

  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? color.border : color.background,
        borderColor: color.border,
      }}
      className="mr-2 mt-2 rounded-full border px-4 py-2"
    >
      <Text
        style={{ color: selected ? "#FFFFFF" : color.text }}
        className="text-xs font-bold"
      >
        {color.label}
      </Text>
    </Pressable>
  );
}

export default function BarberCalendar() {
  const currentUser = auth.currentUser;
  const [calendarView, setCalendarView] = useState("day");
  const [anchorDate, setAnchorDate] = useState(getTodayDateString());
  const [bookings, setBookings] = useState([]);
  const [personalEvents, setPersonalEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getTodayDateString());
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventColorKey, setEventColorKey] = useState("personal");
  const [eventRepeatRule, setEventRepeatRule] = useState("none");

  const storageKey = currentUser?.uid
    ? `barberCalendarEvents:${currentUser.uid}`
    : null;

  const visibleDates = useMemo(() => {
    if (calendarView === "day") {
      return [anchorDate];
    }

    return getWeekDates(anchorDate);
  }, [anchorDate, calendarView]);

  const bookingEvents = useMemo(
    () =>
      bookings
        .filter((booking) => {
          const hasVisibleStatus =
            booking.status === "pending" ||
            booking.status === "confirmed";

          return (
            hasVisibleStatus &&
            booking.appointmentDate &&
            booking.startTime &&
            booking.endTime
          );
        })
        .map(buildBookingEvent),
    [bookings]
  );

  const visibleEvents = useMemo(() => {
    const expandedPersonalEvents = visibleDates.flatMap((dateKey) =>
      personalEvents
        .filter((event) =>
          doesRepeatingEventLandOnDate(event, dateKey)
        )
        .map((event) => normalizePersonalEvent(event, dateKey))
    );

    return [...bookingEvents, ...expandedPersonalEvents];
  }, [bookingEvents, personalEvents, visibleDates]);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!currentUser?.uid) {
        throw new Error("You must be logged in to view your calendar.");
      }

      const [loadedBookings, savedEvents] = await Promise.all([
        getBookingsForBarber(currentUser.uid),
        storageKey ? AsyncStorage.getItem(storageKey) : null,
      ]);

      setBookings(loadedBookings);
      setPersonalEvents(savedEvents ? JSON.parse(savedEvents) : []);
    } catch (error) {
      console.log("Load barber calendar error:", error);
      setErrorMessage("Could not load calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid, storageKey]);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [loadCalendarData])
  );

  async function savePersonalEvents(nextEvents) {
    setPersonalEvents(nextEvents);

    if (storageKey) {
      await AsyncStorage.setItem(
        storageKey,
        JSON.stringify(nextEvents)
      );
    }
  }

  function resetEventForm() {
    setEventTitle("");
    setEventDate(anchorDate);
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setEventColorKey("personal");
    setEventRepeatRule("none");
  }

  function openEventModal() {
    resetEventForm();
    setEventModalVisible(true);
  }

  async function handleSaveEvent() {
    const trimmedTitle = eventTitle.trim();

    if (!trimmedTitle) {
      Alert.alert("Title required", "Add a name for this event.");
      return;
    }

    if (!eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert("Date format", "Use YYYY-MM-DD for the event date.");
      return;
    }

    if (timeToMinutes(eventStartTime) >= timeToMinutes(eventEndTime)) {
      Alert.alert("Time range", "End time must be after start time.");
      return;
    }

    const nextEvent = {
      id: `${Date.now()}`,
      type: "personal",
      title: trimmedTitle,
      subtitle: EVENT_COLORS[eventColorKey]?.label || "Personal",
      note: "",
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      colorKey: eventColorKey,
      repeatRule: eventRepeatRule,
    };

    await savePersonalEvents([...personalEvents, nextEvent]);
    setEventModalVisible(false);
  }

  function moveCalendar(direction) {
    const amount = calendarView === "day" ? direction : direction * 7;
    setAnchorDate((currentDate) => addDays(currentDate, amount));
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background">
        <ActivityIndicator size="large" />

        <Text className="mt-3 text-app-text-secondary">
          Loading calendar...
        </Text>
      </SafeAreaView>
    );
  }

  if (errorMessage) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-app-background px-6">
        <Text className="text-center text-base font-semibold text-app-primary">
          {errorMessage}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-app-background">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Text className="text-3xl font-bold text-app-text">
          Cal<Text className="text-app-primary">endar</Text>
        </Text>

        <View className="flex-row items-center">
          <Pressable
            onPress={() => setSettingsVisible((current) => !current)}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons
              name="settings-outline"
              size={23}
              color="#1677FF"
            />
          </Pressable>

          <Pressable
            onPress={openEventModal}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary active:bg-app-primary-pressed"
          >
            <Ionicons name="add" size={25} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-5">
        <View className="rounded-2xl border border-app-border bg-app-surface p-2">
          <View className="flex-row">
            {["day", "week"].map((viewOption) => {
              const isSelected = calendarView === viewOption;

              return (
                <Pressable
                  key={viewOption}
                  onPress={() => setCalendarView(viewOption)}
                  className={
                    isSelected
                      ? "flex-1 rounded-xl bg-app-primary px-4 py-3"
                      : "flex-1 rounded-xl px-4 py-3"
                  }
                >
                  <Text
                    className={
                      isSelected
                        ? "text-center text-sm font-bold text-app-text-inverse"
                        : "text-center text-sm font-bold text-app-text-secondary"
                    }
                  >
                    {viewOption === "day" ? "Day" : "Week"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="mt-4 rounded-2xl border border-app-border bg-app-surface p-4">
          <View className="flex-row items-center justify-between">
            <Pressable
              onPress={() => moveCalendar(-1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color="#1677FF"
              />
            </Pressable>

            <Pressable
              onPress={() => setAnchorDate(getTodayDateString())}
              className="rounded-full bg-app-surface-elevated px-5 py-2"
            >
              <Text className="text-sm font-bold text-app-text">
                {calendarView === "day"
                  ? formatHeaderDate(anchorDate)
                  : `${formatHeaderDate(visibleDates[0])} - ${formatHeaderDate(
                      visibleDates[6]
                    )}`}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => moveCalendar(1)}
              className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color="#1677FF"
              />
            </Pressable>
          </View>

          {settingsVisible ? (
            <View className="mt-4 rounded-2xl bg-app-surface-elevated p-4">
              <Text className="text-sm font-bold text-app-text">
                Event Colors
              </Text>

              <View className="mt-1 flex-row flex-wrap">
                {Object.keys(EVENT_COLORS).map((colorKey) => (
                  <ColorChip
                    key={colorKey}
                    colorKey={colorKey}
                    selected={false}
                    onPress={() => setEventColorKey(colorKey)}
                  />
                ))}
              </View>
            </View>
          ) : null}

          <View className="mt-4 flex-row">
            <View className="mr-3 pt-14">
              {HOUR_ROWS.map((hour) => (
                <View
                  key={hour}
                  className="h-20 items-end justify-start"
                >
                  <Text className="text-xs font-semibold text-app-text-muted">
                    {getHourLabel(hour)}
                  </Text>
                </View>
              ))}
            </View>

            {calendarView === "day" ? (
              <CalendarDayColumn
                dateKey={anchorDate}
                events={visibleEvents}
              />
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
              >
                {visibleDates.map((dateKey) => (
                  <CalendarDayColumn
                    key={dateKey}
                    dateKey={dateKey}
                    events={visibleEvents}
                    compact
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View className="h-8" />
      </ScrollView>

      <Modal
        visible={eventModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEventModalVisible(false)}
      >
        <View
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          className="flex-1 justify-end"
        >
          <View className="rounded-t-3xl bg-app-background px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-app-text">
                Add Event
              </Text>

              <Pressable
                onPress={() => setEventModalVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
              >
                <Ionicons name="close" size={22} color="#1677FF" />
              </Pressable>
            </View>

            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="School, BJJ, blocked time..."
              placeholderTextColor="#8292A6"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />

            <View className="mt-3 flex-row">
              <TextInput
                value={eventDate}
                onChangeText={setEventDate}
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#8292A6"
                className="mr-2 flex-1 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
              />

              <TextInput
                value={eventStartTime}
                onChangeText={setEventStartTime}
                placeholder="09:00"
                placeholderTextColor="#8292A6"
                className="w-24 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
              />
            </View>

            <TextInput
              value={eventEndTime}
              onChangeText={setEventEndTime}
              placeholder="10:00"
              placeholderTextColor="#8292A6"
              className="mt-3 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />

            <Text className="mt-4 text-sm font-bold text-app-text">
              Color
            </Text>

            <View className="flex-row flex-wrap">
              {Object.keys(EVENT_COLORS)
                .filter((colorKey) => colorKey !== "booking")
                .map((colorKey) => (
                  <ColorChip
                    key={colorKey}
                    colorKey={colorKey}
                    selected={eventColorKey === colorKey}
                    onPress={() => setEventColorKey(colorKey)}
                  />
                ))}
            </View>

            <Text className="mt-4 text-sm font-bold text-app-text">
              Repeat
            </Text>

            <View className="mt-2 flex-row">
              {REPEAT_OPTIONS.map((option) => {
                const selected = eventRepeatRule === option.value;

                return (
                  <Pressable
                    key={option.value}
                    onPress={() => setEventRepeatRule(option.value)}
                    className={
                      selected
                        ? "mr-2 rounded-full bg-app-primary px-4 py-2"
                        : "mr-2 rounded-full border border-app-border bg-app-surface px-4 py-2"
                    }
                  >
                    <Text
                      className={
                        selected
                          ? "text-xs font-bold text-app-text-inverse"
                          : "text-xs font-bold text-app-text-secondary"
                      }
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={handleSaveEvent}
              className="mt-5 rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                Save Event
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
