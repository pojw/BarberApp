# BarberApp Frontend Documentation

## Stack

- React Native
- Expo
- Expo Router
- NativeWind / Tailwind
- Firebase client SDK
- AsyncStorage for Firebase Auth persistence

## Current Route Structure

```txt
src/app
  index.jsx
  (auth)
    _layout.jsx
    login.jsx
    signup.jsx
    forgotPassword.jsx
  onboarding
    _layout.jsx
    index.jsx
    client.jsx
    barber.jsx
  client
    _layout.jsx
    editProfile.jsx
    barber
      [barberId].jsx
    conversation
      [conversationId].jsx
    (tabs)
      _layout.jsx
      home.jsx
      search.jsx
      bookings.jsx
      messages.jsx
      profile.jsx
  barber
    _layout.jsx
    editProfile.jsx
    services.jsx
    availability.jsx
    conversation
      [conversationId].jsx
    (tabs)
      _layout.jsx
      dashboard.jsx
      calendar.jsx
      bookings.jsx
      messages.jsx
      chatbot.jsx
      profile.jsx
```

## Routing Notes

- Role-level folders use Stack navigation.
- Bottom tabs are inside `(tabs)`.
- Extra screens such as edit profile, services, availability, and conversation pages are outside `(tabs)` so they do not show as tab buttons.
- Root routing is centralized and waits for Firebase Auth restoration.

## Completed Frontend Features

### Auth UI

- signup
- login
- forgot password placeholder
- logout
- persistent auth loading state

### Onboarding

- client onboarding
- barber onboarding
- role saved to Firestore
- onboarded status saved to Firestore
- AuthContext refresh after onboarding

### Client Screens

- client home placeholder/currently planned for summary
- client search
- barber detail page
- client bookings
- client messages
- client profile
- client edit profile
- client conversation screen

### Barber Screens

- barber dashboard placeholder/currently planned for summary
- barber bookings
- barber messages
- barber chatbot placeholder
- barber profile
- barber edit profile
- barber services page
- barber availability page
- barber conversation screen

## Current Completed Systems

- authentication UI
- role-based navigation
- protected route layouts
- profile display and editing
- barber services CRUD
- barber availability management
- barber discovery
- booking UI and booking creation
- booking management
- real-time messaging

## Current Frontend Priority

Build useful landing screens:

- `src/app/client/(tabs)/home.jsx`
- `src/app/barber/(tabs)/dashboard.jsx`

## Planned Frontend Work

- better dashboard/home cards
- reusable booking card component
- reusable message card component
- reusable loading/error/empty state components
- better date picker
- unread message indicators
- notification permission UI
- profile image upload UI
- portfolio upload UI
- reviews UI
- AI chatbot UI
- AI hair profile review/edit UI

## Future Frontend Cleanup

- refactor long screen files
- extract repeated card UI
- extract repeated action buttons
- extract repeated Firestore loading patterns
- add route constants
- add status constants
- improve UI spacing/colors
- improve form validation
- improve error messages
