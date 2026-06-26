# BarberApp Booking System

## Overview

The core booking system is functional on both the client and barber side.

Clients can create bookings. Barbers can manage bookings. Booking status updates are stored in Firestore.

## Booking Collection

Bookings are stored in a top-level collection:

```txt
bookings/{bookingId}
```

## Booking Fields

- clientId
- barberId
- clientName
- barberName
- businessName
- services
- totalPrice
- totalDurationMinutes
- appointmentDate
- startTime
- endTime
- clientNotes
- status
- createdAt
- updatedAt

## Booking Statuses

- pending
- confirmed
- completed
- cancelled

## Blocking Rules

Blocking statuses:

- pending
- confirmed

Non-blocking statuses:

- cancelled
- completed

This means cancelled and completed bookings do not block future slot generation.

## Client Booking Flow

```txt
Client selects barber
-> selects one or more services
-> total duration and price are calculated
-> selects date
-> app generates valid appointment slots
-> existing pending/confirmed bookings block overlaps
-> client selects time
-> client confirms booking
-> booking is created in Firestore as pending
-> booking appears in client bookings tab
```

## Barber Booking Flow

```txt
Barber opens bookings tab
-> sees assigned bookings
-> filters bookings
-> confirms pending bookings
-> cancels pending/confirmed bookings
-> completes confirmed bookings
```

## Current Booking Actions

Client:

- create booking
- cancel pending booking
- cancel confirmed booking

Barber:

- confirm pending booking
- cancel pending booking
- cancel confirmed booking
- complete confirmed booking

## Valid Status Transitions

- pending -> confirmed
- pending -> cancelled
- confirmed -> completed
- confirmed -> cancelled

Invalid transitions:

- completed -> confirmed
- cancelled -> confirmed
- completed -> cancelled
- cancelled -> completed

## Booking Utilities

Current files:

- `src/utils/bookingTime.js`
- `src/utils/generateBookingSlots.js`
- `src/utils/filterAvailableSlots.js`

Functions:

- `timeToMinutes()`
- `minutesToTime()`
- `addMinutesToTime()`
- `timesOverlap()`
- `formatTime12Hour()`

## Current Slot Logic

- slots generate in 15-minute increments
- slot generation uses barber start/end availability
- selected service durations are summed
- slots ending after closing are removed
- pending/confirmed bookings block overlapping slots
- back-to-back appointments are allowed

## Current Filters

Barber booking filters:

- All
- Today
- Upcoming
- Specific Date

Status filters:

- All
- Pending
- Confirmed
- Completed
- Cancelled

## Future Booking Work

- booking detail page/modal if cards become crowded
- better date picker
- booking reminders
- push notifications
- cancellation reason
- no-show status
- reviews after completed booking
- payment status
- membership-tier booking rules
- back-to-back-only enforcement setting
- Firestore transactions or server-side booking validation for race conditions
