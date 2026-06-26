# BarberApp Security Rules Plan

## Current Security Direction

Firestore rules have moved away from fully open development mode and toward secure MVP rules.

Protected data includes:

- users
- clients
- barbers
- bookings
- conversations
- messages

## Current Rule Goals

### Users

- users can read/write their own user document
- users cannot edit other users' private account data

### Clients

- clients can manage their own client profile
- other users should not freely write client profiles

### Barbers

- barbers can manage their own barber profile
- public barber profile reads are allowed where needed for search/detail pages
- only owner barber should write their profile/services/availability

### Bookings

- client can create booking only for themselves
- client can read bookings where `clientId === request.auth.uid`
- barber can read bookings where `barberId === request.auth.uid`
- client can cancel own pending/confirmed bookings
- barber can confirm/cancel/complete own bookings
- random users cannot read unrelated bookings

### Conversations

- only participants can read conversation
- only participants can read messages
- only participants can create messages
- senderId must match logged-in user
- conversation/message deletion disabled

## Future Rules To Strengthen

- enforce booking status transitions server-side
- prevent clients from changing barberId/clientId after creation
- prevent clients from changing service price/date/time after creation
- prevent barbers from editing unrelated bookings
- prevent users from adding themselves to unrelated conversations
- add Firebase Storage rules for images
- add AI data access rules
- test with Firebase Emulator

## Storage Rules Needed Later

Protect:

- profile images
- barber portfolio images
- AI-uploaded hair photos
- temporary analysis images

Possible policy:

- user can upload own profile image
- barber can upload own portfolio images
- AI photos should be private to the user
- AI images may be deleted after analysis
