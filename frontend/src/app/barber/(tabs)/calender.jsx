import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";

import MessagePopup from "../../../components/MessagePopup";
import TimeInput from "../../../components/barber/TimeInput";
import { auth } from "../../../config/firebase";
import { getBookingsForBarber } from "../../../services/bookingService";
import {
  BOOKING_CALENDAR_TYPES,
  CALENDAR_COLOR_OPTIONS,
  DEFAULT_CALENDAR_TYPES,
  getBarberCalendarInfo,
  saveBarberCalendarInfo,
} from "../../../services/barberCalendarService";
import {
  formatTime12Hour,
  timeToMinutes,
  timesOverlap,
} from "../../../utils/bookingTime";

const HOUR_ROWS = Array.from({ length: 24 }, (_, index) => index);
const HOUR_ROW_HEIGHT = 80;
const REPEAT_OPTIONS = [
  { label: "One time", value: "none" },
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
];

function getTodayDateString() {
  return formatDateKey(new Date());
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

function formatLongDate(dateKey) {
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
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

function getCalendarType(typeId, eventTypes) {
  return (
    [...BOOKING_CALENDAR_TYPES, ...eventTypes].find(
      (type) => type.id === typeId
    ) || DEFAULT_CALENDAR_TYPES[0]
  );
}

function buildBookingEvent(booking) {
  const statusLabel =
    booking.status === "confirmed" ? "Confirmed" : "Pending";

  return {
    id: `booking-${booking.id}`,
    sourceId: booking.id,
    source: "booking",
    typeId:
      booking.status === "confirmed"
        ? "booking_confirmed"
        : "booking_pending",
    title: booking.clientName || "Client",
    subtitle: `${statusLabel} • ${getServicesText(booking)}`,
    note: booking.clientNotes || "",
    date: booking.appointmentDate,
    startTime: booking.startTime,
    endTime: booking.endTime,
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

  return (
    event.repeatRule === "weekly" &&
    eventDate.getDay() === targetDate.getDay()
  );
}

function normalizeCustomEvent(event, dateKey) {
  return {
    ...event,
    id: `${event.id}-${dateKey}`,
    sourceId: event.id,
    source: "custom",
    date: dateKey,
  };
}

function sortEventsByDateTime(events) {
  return [...events].sort((a, b) => {
    const dateA = `${a.date || ""} ${a.startTime || ""}`;
    const dateB = `${b.date || ""} ${b.startTime || ""}`;

    return dateA.localeCompare(dateB);
  });
}

function getEventLayout(event) {
  const startMinutes = timeToMinutes(event.startTime);
  const endMinutes = timeToMinutes(event.endTime);
  const durationMinutes = Math.max(endMinutes - startMinutes, 15);

  return {
    top: (startMinutes / 60) * HOUR_ROW_HEIGHT,
    height: Math.max((durationMinutes / 60) * HOUR_ROW_HEIGHT - 4, 44),
  };
}

function findOverlappingEvent(newEvent, events) {
  return events.find((event) => {
    if (event.sourceId === newEvent.id) {
      return false;
    }

    if (event.date !== newEvent.date) {
      return false;
    }

    if (!event.startTime || !event.endTime) {
      return false;
    }

    return timesOverlap(
      newEvent.startTime,
      newEvent.endTime,
      event.startTime,
      event.endTime
    );
  });
}

function EventBlock({ event, eventTypes, style }) {
  const type = getCalendarType(event.typeId, eventTypes);
  const color = type.color;

  return (
    <View
      style={{
        backgroundColor: color.background,
        borderColor: color.border,
        ...style,
      }}
      className="overflow-hidden rounded-xl border px-3 py-2"
    >
      <Text style={{ color: color.text }} className="text-xs font-bold">
        {event.title}
      </Text>

      <Text className="mt-1 text-xs text-app-text-secondary">
        {formatTime12Hour(event.startTime)} - {formatTime12Hour(event.endTime)}
      </Text>

      {event.subtitle ? (
        <Text numberOfLines={2} className="mt-1 text-xs text-app-text-muted">
          {event.subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function CalendarDayColumn({ dateKey, events, eventTypes, compact = false }) {
  const isToday = dateKey === getTodayDateString();
  const dayEvents = events.filter((event) => event.date === dateKey);

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

      <View
        style={{ height: HOUR_ROWS.length * HOUR_ROW_HEIGHT }}
        className="relative"
      >
        {HOUR_ROWS.map((hour) => (
          <View
            key={`${dateKey}-${hour}`}
            style={{ height: HOUR_ROW_HEIGHT }}
            className="border-t border-app-border-subtle"
          />
        ))}

        {dayEvents.map((event) => {
          const layout = getEventLayout(event);

          return (
            <EventBlock
              key={event.id}
              event={event}
              eventTypes={eventTypes}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: layout.top,
                height: layout.height,
              }}
            />
          );
        })}
      </View>
    </View>
  );
}

function TypeChip({ type, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: selected ? type.color.border : type.color.background,
        borderColor: type.color.border,
      }}
      className="mr-2 mt-2 rounded-full border px-4 py-2"
    >
      <Text
        style={{ color: selected ? "#FFFFFF" : type.color.text }}
        className="text-xs font-bold"
      >
        {type.name}
      </Text>
    </Pressable>
  );
}

function ColorSwatch({ color, selected, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        backgroundColor: color.border,
        borderColor: selected ? "#0B1F3A" : color.border,
      }}
      className="mr-3 h-9 w-9 rounded-full border-2"
    />
  );
}

function AgendaItem({ event, eventTypes }) {
  const type = getCalendarType(event.typeId, eventTypes);

  return (
    <View className="mb-3 flex-row items-center rounded-2xl bg-app-surface p-4">
      <View
        style={{ backgroundColor: type.color.border }}
        className="mr-3 h-10 w-1 rounded-full"
      />

      <View className="flex-1">
        <Text className="text-base font-bold text-app-text">
          {event.title}
        </Text>
        <Text className="mt-1 text-sm text-app-text-secondary">
          {formatLongDate(event.date)} • {formatTime12Hour(event.startTime)} -{" "}
          {formatTime12Hour(event.endTime)}
        </Text>
        <Text className="mt-1 text-xs font-bold text-app-text-muted">
          {type.name}
        </Text>
      </View>
    </View>
  );
}

export default function BarberCalendar() {
  const currentUser = auth.currentUser;
  const [calendarView, setCalendarView] = useState("day");
  const [anchorDate, setAnchorDate] = useState(getTodayDateString());
  const [bookings, setBookings] = useState([]);
  const [eventTypes, setEventTypes] = useState(DEFAULT_CALENDAR_TYPES);
  const [customEvents, setCustomEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [eventDatePickerVisible, setEventDatePickerVisible] = useState(false);
  const [timePickerField, setTimePickerField] = useState(null);
  const [parentScrollEnabled, setParentScrollEnabled] = useState(true);
  const [messageModal, setMessageModal] = useState({
    visible: false,
    title: "",
    detail: "",
  });
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState(getTodayDateString());
  const [eventStartTime, setEventStartTime] = useState("09:00");
  const [eventEndTime, setEventEndTime] = useState("10:00");
  const [eventTypeId, setEventTypeId] = useState(DEFAULT_CALENDAR_TYPES[0].id);
  const [eventRepeatRule, setEventRepeatRule] = useState("none");
  const [settingsTypeId, setSettingsTypeId] = useState(
    DEFAULT_CALENDAR_TYPES[0].id
  );
  const [settingsTypeName, setSettingsTypeName] = useState(
    DEFAULT_CALENDAR_TYPES[0].name
  );
  const [settingsTypeColor, setSettingsTypeColor] = useState(
    DEFAULT_CALENDAR_TYPES[0].color
  );

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
            booking.status === "pending" || booking.status === "confirmed";

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
    const expandedCustomEvents = visibleDates.flatMap((dateKey) =>
      customEvents
        .filter((event) => doesRepeatingEventLandOnDate(event, dateKey))
        .map((event) => normalizeCustomEvent(event, dateKey))
    );

    return sortEventsByDateTime([...bookingEvents, ...expandedCustomEvents]);
  }, [bookingEvents, customEvents, visibleDates]);

  const agendaEvents = useMemo(() => {
    const todayDateKey = getTodayDateString();

    return visibleEvents.filter((event) => event.date >= todayDateKey);
  }, [visibleEvents]);

  const loadCalendarData = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      if (!currentUser?.uid) {
        throw new Error("You must be logged in to view your calendar.");
      }

      const [loadedBookings, calendarInfo] = await Promise.all([
        getBookingsForBarber(currentUser.uid),
        getBarberCalendarInfo(currentUser.uid),
      ]);

      setBookings(loadedBookings);
      setEventTypes(calendarInfo.eventTypes);
      setCustomEvents(calendarInfo.events);
    } catch (error) {
      console.log("Load barber calendar error:", error);
      setErrorMessage("Could not load calendar. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [currentUser?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadCalendarData();
    }, [loadCalendarData])
  );

  function showMessage(title, detail) {
    setMessageModal({
      visible: true,
      title,
      detail,
    });
  }

  function closeMessage() {
    setMessageModal((current) => ({
      ...current,
      visible: false,
    }));
  }

  async function persistCalendarInfo(nextTypes, nextEvents) {
    if (!currentUser?.uid) {
      return false;
    }

    try {
      setSaving(true);

      const savedInfo = await saveBarberCalendarInfo(currentUser.uid, {
        eventTypes: nextTypes,
        events: nextEvents,
      });

      setEventTypes(savedInfo.eventTypes);
      setCustomEvents(savedInfo.events);
      return true;
    } catch (error) {
      console.log("Save barber calendar error:", error);
      showMessage("Save failed", "Could not save calendar changes.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  function resetEventForm() {
    setEventTitle("");
    setEventDate(anchorDate);
    setEventStartTime("09:00");
    setEventEndTime("10:00");
    setEventTypeId(eventTypes[0]?.id || DEFAULT_CALENDAR_TYPES[0].id);
    setEventRepeatRule("none");
  }

  function openEventModal() {
    resetEventForm();
    setEventModalVisible(true);
  }

  function closeEventModal() {
    setParentScrollEnabled(true);
    setEventDatePickerVisible(false);
    setTimePickerField(null);
    setEventModalVisible(false);
  }

  function closeTimePicker() {
    setParentScrollEnabled(true);
    setTimePickerField(null);
  }

  function updateSelectedTime(value) {
    if (timePickerField === "start") {
      setEventStartTime(value);
      return;
    }

    if (timePickerField === "end") {
      setEventEndTime(value);
    }
  }

  function selectSettingsType(type) {
    setSettingsTypeId(type.id);
    setSettingsTypeName(type.name);
    setSettingsTypeColor(type.color);
  }

  function openSettingsModal() {
    const selectedType =
      eventTypes.find((type) => type.id === settingsTypeId) ||
      eventTypes[0] ||
      DEFAULT_CALENDAR_TYPES[0];

    selectSettingsType(selectedType);
    setSettingsVisible(true);
  }

  async function handleSaveEvent() {
    const trimmedTitle = eventTitle.trim();

    if (!trimmedTitle) {
      showMessage("Title required", "Add a name for this event.");
      return;
    }

    if (!eventDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      showMessage("Date format", "Use YYYY-MM-DD for the event date.");
      return;
    }

    if (timeToMinutes(eventStartTime) >= timeToMinutes(eventEndTime)) {
      showMessage("Time range", "End time must be after start time.");
      return;
    }

    const selectedType = getCalendarType(eventTypeId, eventTypes);
    const nextEvent = {
      id: `${Date.now()}`,
      typeId: selectedType.id,
      title: trimmedTitle,
      date: eventDate,
      startTime: eventStartTime,
      endTime: eventEndTime,
      repeatRule: eventRepeatRule,
    };
    const existingEventsForDate = [
      ...bookingEvents,
      ...customEvents
        .filter((event) => doesRepeatingEventLandOnDate(event, eventDate))
        .map((event) => normalizeCustomEvent(event, eventDate)),
    ];
    const overlappingEvent = findOverlappingEvent(
      nextEvent,
      existingEventsForDate
    );

    if (overlappingEvent) {
      showMessage(
        "Time overlap",
        `${overlappingEvent.title} is already scheduled from ${formatTime12Hour(
          overlappingEvent.startTime
        )} to ${formatTime12Hour(overlappingEvent.endTime)}.`
      );
      return;
    }

    const saved = await persistCalendarInfo(eventTypes, [
      ...customEvents,
      nextEvent,
    ]);

    if (saved) {
      setEventModalVisible(false);
    }
  }

  async function handleSaveTypeSettings() {
    const trimmedName = settingsTypeName.trim();

    if (!trimmedName) {
      showMessage("Name required", "Add a name for this calendar type.");
      return;
    }

    const nextTypes = eventTypes.map((type) =>
      type.id === settingsTypeId
        ? {
            ...type,
            name: trimmedName,
            color: settingsTypeColor,
          }
        : type
    );

    const saved = await persistCalendarInfo(nextTypes, customEvents);

    if (saved) {
      setEventTypeId((currentTypeId) =>
        currentTypeId === settingsTypeId ? settingsTypeId : currentTypeId
      );
      setSettingsVisible(false);
    }
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
            onPress={openSettingsModal}
            className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-app-primary-soft active:bg-app-surface-elevated"
          >
            <Ionicons name="settings-outline" size={23} color="#1677FF" />
          </Pressable>

          <Pressable
            onPress={openEventModal}
            className="h-11 w-11 items-center justify-center rounded-full bg-app-primary active:bg-app-primary-pressed"
          >
            <Ionicons name="add" size={25} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      <ScrollView className="flex-1 px-5" scrollEnabled={parentScrollEnabled}>
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
              <Ionicons name="chevron-back" size={22} color="#1677FF" />
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
              <Ionicons name="chevron-forward" size={22} color="#1677FF" />
            </Pressable>
          </View>

          <View className="mt-4 flex-row">
            <View className="mr-3 pt-14">
              {HOUR_ROWS.map((hour) => (
                <View
                  key={hour}
                  style={{ height: HOUR_ROW_HEIGHT }}
                  className="items-end justify-start"
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
                eventTypes={eventTypes}
              />
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {visibleDates.map((dateKey) => (
                  <CalendarDayColumn
                    key={dateKey}
                    dateKey={dateKey}
                    events={visibleEvents}
                    eventTypes={eventTypes}
                    compact
                  />
                ))}
              </ScrollView>
            )}
          </View>
        </View>

        <View className="mt-5">
          <Text className="mb-3 text-lg font-bold text-app-text">
            Agenda
          </Text>

          {agendaEvents.length === 0 ? (
            <View className="rounded-2xl bg-app-surface p-4">
              <Text className="text-sm font-semibold text-app-text-muted">
                No upcoming events for this {calendarView}.
              </Text>
            </View>
          ) : (
            agendaEvents.map((event) => (
              <AgendaItem
                key={`agenda-${event.id}`}
                event={event}
                eventTypes={eventTypes}
              />
            ))
          )}
        </View>

        <View className="h-8" />
      </ScrollView>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <Pressable
          onPress={() => setSettingsVisible(false)}
          className="flex-1 items-center justify-center px-5"
          style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
        >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="relative w-full rounded-3xl border border-app-border bg-app-surface px-5 pb-6 pt-5"
        >
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-xl font-bold text-app-text">
                Settings
              </Text>

              <Pressable
                onPress={() => setSettingsVisible(false)}
                className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
              >
                <Ionicons name="close" size={22} color="#1677FF" />
              </Pressable>
            </View>

            <Text className="text-sm font-bold text-app-text">
              Event Type
            </Text>

            <View className="mt-1 flex-row flex-wrap">
              {eventTypes.map((type) => (
                <TypeChip
                  key={type.id}
                  type={type}
                  selected={settingsTypeId === type.id}
                  onPress={() => selectSettingsType(type)}
                />
              ))}
            </View>

            <TextInput
              value={settingsTypeName}
              onChangeText={setSettingsTypeName}
              placeholder="Event type"
              placeholderTextColor="#8292A6"
              className="mt-4 rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />

            <Text className="mt-4 text-sm font-bold text-app-text">
              Event Color
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3"
            >
              {CALENDAR_COLOR_OPTIONS.map((color) => (
                <ColorSwatch
                  key={color.id}
                  color={color}
                  selected={settingsTypeColor.id === color.id}
                  onPress={() => setSettingsTypeColor(color)}
                />
              ))}
            </ScrollView>

            <View
              style={{
                backgroundColor: settingsTypeColor.background,
                borderColor: settingsTypeColor.border,
              }}
              className="mt-4 rounded-2xl border px-4 py-3"
            >
              <Text
                style={{ color: settingsTypeColor.text }}
                className="text-sm font-bold"
              >
                {settingsTypeName.trim() || "Event Type"}
              </Text>
            </View>

            <Pressable
              onPress={handleSaveTypeSettings}
              disabled={saving}
              className={`mt-5 rounded-2xl px-4 py-4 ${
                saving
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {saving ? "Saving..." : "Save Settings"}
              </Text>
            </Pressable>

            <MessagePopup
              visible={messageModal.visible}
              title={messageModal.title}
              detail={messageModal.detail}
              onClose={closeMessage}
            />
          </Pressable>
        </Pressable>
      </Modal>

      <Modal
        visible={eventModalVisible}
        transparent
        animationType="slide"
        onRequestClose={closeEventModal}
      >
        <View
          style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
          className="flex-1 justify-end"
        >
          <View className="relative rounded-t-3xl bg-app-background px-5 pb-8 pt-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-2xl font-bold text-app-text">
                Add Event
              </Text>

              <Pressable
                onPress={closeEventModal}
                className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
              >
                <Ionicons name="close" size={22} color="#1677FF" />
              </Pressable>
            </View>

            <TextInput
              value={eventTitle}
              onChangeText={setEventTitle}
              placeholder="Event name"
              placeholderTextColor="#8292A6"
              className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 text-base text-app-text"
            />

            <Text className="mt-4 text-xs font-bold uppercase text-app-text-muted">
              Date
            </Text>

            <Pressable
              onPress={() => setEventDatePickerVisible(true)}
              className="mt-2 flex-row items-center justify-between rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 active:bg-app-primary-soft"
            >
              <Text className="text-base font-semibold text-app-text">
                {formatLongDate(eventDate)}
              </Text>
              <Ionicons name="calendar-outline" size={20} color="#1677FF" />
            </Pressable>

            <View className="mt-4 flex-row gap-3">
              <View className="flex-1">
                <Text className="mb-2 text-xs font-bold uppercase text-app-text-muted">
                  Start
                </Text>
                <Pressable
                  onPress={() => setTimePickerField("start")}
                  className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 active:bg-app-primary-soft"
                >
                  <Text className="text-base font-bold text-app-text">
                    {formatTime12Hour(eventStartTime)}
                  </Text>
                </Pressable>
              </View>

              <View className="flex-1">
                <Text className="mb-2 text-xs font-bold uppercase text-app-text-muted">
                  End
                </Text>
                <Pressable
                  onPress={() => setTimePickerField("end")}
                  className="rounded-2xl border border-app-border bg-app-surface-elevated px-4 py-4 active:bg-app-primary-soft"
                >
                  <Text className="text-base font-bold text-app-text">
                    {formatTime12Hour(eventEndTime)}
                  </Text>
                </Pressable>
              </View>
            </View>

            <Text className="mt-4 text-sm font-bold text-app-text">
              Type
            </Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-1"
            >
              {eventTypes.map((type) => (
                <TypeChip
                  key={type.id}
                  type={type}
                  selected={eventTypeId === type.id}
                  onPress={() => setEventTypeId(type.id)}
                />
              ))}
            </ScrollView>

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
              disabled={saving}
              className={`mt-5 rounded-2xl px-4 py-4 ${
                saving
                  ? "bg-app-disabled"
                  : "bg-app-primary active:bg-app-primary-pressed"
              }`}
            >
              <Text className="text-center text-base font-bold text-app-text-inverse">
                {saving ? "Saving..." : "Save Event"}
              </Text>
            </Pressable>

            <MessagePopup
              visible={messageModal.visible}
              title={messageModal.title}
              detail={messageModal.detail}
              onClose={closeMessage}
            />

            {timePickerField ? (
              <View className="absolute inset-0 z-40 justify-end bg-black/40">
                <Pressable className="flex-1" onPress={closeTimePicker} />

                <View className="rounded-t-3xl bg-app-background px-5 pb-6 pt-4">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-xl font-bold text-app-text">
                      {timePickerField === "start" ? "Start" : "End"}
                    </Text>

                    <Pressable
                      onPress={closeTimePicker}
                      className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
                    >
                      <Ionicons name="close" size={22} color="#1677FF" />
                    </Pressable>
                  </View>

                  <TimeInput
                    label={timePickerField === "start" ? "Start" : "End"}
                    value={
                      timePickerField === "start"
                        ? eventStartTime
                        : eventEndTime
                    }
                    onChange={updateSelectedTime}
                    disabled={saving}
                    showLabel={false}
                    showBorder={false}
                    onWheelTouchStart={() => setParentScrollEnabled(false)}
                    onWheelTouchEnd={() => setParentScrollEnabled(true)}
                  />

                  <Pressable
                    onPress={closeTimePicker}
                    className="mt-5 rounded-2xl bg-app-primary px-4 py-4 active:bg-app-primary-pressed"
                  >
                    <Text className="text-center text-base font-bold text-app-text-inverse">
                      Done
                    </Text>
                  </Pressable>
                </View>
              </View>
            ) : null}

            {eventDatePickerVisible ? (
              <View className="absolute inset-0 z-40 justify-center bg-black/40 px-5">
                <View className="rounded-3xl bg-app-background p-5">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-2xl font-bold text-app-text">
                      Select Date
                    </Text>

                    <Pressable
                      onPress={() => setEventDatePickerVisible(false)}
                      className="h-10 w-10 items-center justify-center rounded-full bg-app-primary-soft"
                    >
                      <Ionicons name="close" size={22} color="#1677FF" />
                    </Pressable>
                  </View>

                  <Calendar
                    current={eventDate || getTodayDateString()}
                    markedDates={
                      eventDate
                        ? {
                            [eventDate]: {
                              selected: true,
                              selectedColor: "#1677FF",
                              selectedTextColor: "#FFFFFF",
                            },
                          }
                        : {}
                    }
                    onDayPress={(day) => {
                      setEventDate(day.dateString);
                      setEventDatePickerVisible(false);
                    }}
                    theme={{
                      backgroundColor: "#FFFFFF",
                      calendarBackground: "#FFFFFF",
                      textSectionTitleColor: "#52657A",
                      selectedDayBackgroundColor: "#1677FF",
                      selectedDayTextColor: "#FFFFFF",
                      todayTextColor: "#1677FF",
                      dayTextColor: "#0B1F3A",
                      textDisabledColor: "#B9C5D2",
                      arrowColor: "#1677FF",
                      monthTextColor: "#0B1F3A",
                      textMonthFontWeight: "700",
                      textDayFontWeight: "600",
                      textDayHeaderFontWeight: "700",
                    }}
                  />
                </View>
              </View>
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
