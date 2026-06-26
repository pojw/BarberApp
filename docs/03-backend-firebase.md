# BarberApp Backend / Firebase Documentation

## Current Backend Stack

- Firebase Authentication
- Cloud Firestore
- Firebase Storage exported for future images
- Firestore security rules
- Firestore composite indexes
- Cloud Functions planned later

## Current Firestore Collections

```txt
users/{uid}
clients/{uid}
barbers/{uid}
bookings/{bookingId}
conversations/{conversationId}
conversations/{conversationId}/messages/{messageId}
```

## users/{uid}

Shared account-level data.

Current fields:

- fullName
- email
- role
- onboarded
- createdAt
- updatedAt

Future fields:

- profileImageUrl
- pushTokens
- membershipTier
- lastActiveAt
- accountStatus

## clients/{uid}

Client-specific profile data.

Current fields:

- userId
- preferredName
- location.city
- location.state
- favoriteBarbers
- haircutPreferences
- createdAt
- updatedAt

Future fields:

- profileImageUrl
- confirmedHairProfile
- aiAnalysis
- userConfirmedAnalysis
- stylePreferences
- productPreferences
- membershipTier
- savedStyles
- recentBarbers

## barbers/{uid}

Barber/business-specific profile data.

Current fields:

- userId
- businessName
- phone
- bio
- location.city
- location.state
- services
- specialties
- portfolioImages
- availability
- googleCalendarConnected
- rating
- reviewCount
- createdAt
- updatedAt

Future fields:

- profileImageUrl
- businessLogoUrl
- portfolioImages from Firebase Storage
- bookingPolicy
- allowBackToBackOnly
- cancellationPolicy
- paymentEnabled
- stripeAccountId
- averageResponseTime
- isActive
- verified

## Backend Service Files

Current frontend service-layer files include:

- `src/services/bookingService.js`
- `src/services/createBooking.js`
- `src/services/messageService.js`

These are client-side Firebase service helpers.

## Future Backend Folder

A future `backend/` folder may be added for Cloud Functions or server-only logic.

Possible structure:

```txt
backend/
  functions/
    src/
    package.json
```

## Future Backend Responsibilities

- push notifications
- booking reminders
- new message triggers
- booking status change triggers
- payment webhook handling
- server-side booking validation
- admin/moderation tools
- account deletion cleanup
- scheduled tasks

## Push Notification Plan

Planned stack:

- Expo Push Notifications for MVP
- Firebase Cloud Functions for triggers
- Firestore storage for push tokens

Possible token storage:

```txt
users/{uid}
  pushTokens: []
```

or later:

```txt
userPushTokens/{uid}
```

Planned notification triggers:

- onMessageCreated
- onBookingCreated
- onBookingStatusChanged
- scheduledAppointmentReminder

## Future Backend Improvements

- Cloud Functions setup
- push token registration
- notification preferences
- booking reminder jobs
- Firestore transactions or server-side booking creation
- Stripe/payment backend
- stronger security rule testing
- Firebase emulator tests
