# BarberApp Overview

## Product Summary

BarberApp is a two-sided mobile marketplace and scheduling app for barbers and clients.

Clients can discover barbers, view services, check availability, book appointments, manage bookings, and message barbers.

Barbers can manage their business profile, services, availability, booking requests, client conversations, and eventually AI-assisted tools.

## Core User Types

### Client

Clients can:

- create an account
- complete onboarding
- search for barbers
- view barber profiles
- view services
- view availability
- book appointments
- manage bookings
- message barbers
- later receive AI haircut/style recommendations

### Barber

Barbers can:

- create an account
- complete onboarding
- edit profile
- manage services
- manage weekly availability
- receive booking requests
- confirm/cancel/complete bookings
- message clients
- later use AI tools for profile, service, and client-note support

## Current Main App Flow

```txt
User signs up or logs in
-> Firebase restores auth session
-> App checks users/{uid}
-> If onboarded is false, send to onboarding
-> If role is client, send to /client/home
-> If role is barber, send to /barber/dashboard

Core Product Flow

Client searches for barber
-> Client opens barber profile
-> Client selects services
-> App calculates total duration and price
-> Client selects valid appointment slot
-> Booking is created as pending
-> Barber sees booking request
-> Barber confirms/cancels/completes booking
-> Client and barber can message each other
```

## Current Status

Completed:

- authentication
- persistent login
- role-based routing
- protected routes
- onboarding
- profile display/edit
- barber services
- barber availability
- client barber discovery
- booking creation
- client booking management
- barber booking management
- basic real-time messaging
- MVP Firestore security rule direction
- AI architecture direction

Current priority:

- client home summary screen
- barber dashboard summary screen
- then unread counts / notifications / polish

## Long-Term Vision

BarberApp should become a complete barber-client platform with:

- booking
- messaging
- reviews
- notifications
- image uploads
- payments
- AI haircut recommendations
- AI hair/face image analysis
- AI chatbot and RAG recommendation system
