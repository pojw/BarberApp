# BarberApp Messaging System

## Overview

BarberApp has a basic real-time messaging MVP using Firestore.

Clients and barbers can message each other through conversations.

## Firestore Structure

```txt
conversations/{conversationId}
conversations/{conversationId}/messages/{messageId}
```

## Conversation ID Strategy

Conversation IDs are deterministic:

```txt
clientId_barberId
```

This prevents duplicate conversations between the same client and barber.

## Conversation Fields

- participants
- clientId
- barberId
- clientName
- barberName
- businessName
- lastMessage
- lastMessageAt
- createdAt
- updatedAt

## Message Fields

- senderId
- senderName
- text
- createdAt

## Service File

`src/services/messageService.js`

Current functions:

- `getOrCreateConversation()`
- `sendMessage()`
- `getConversationById()`
- `getConversationsForUser()`
- `listenToUserConversations()`
- `listenToConversationMessages()`

## Current Messaging Flow

```txt
Client opens barber detail page
-> taps Message Barber
-> conversation is created or reused
-> client sends message
-> barber sees conversation
-> barber opens chat
-> barber replies
-> client sees reply
```

## Real-Time Behavior

Messaging uses Firestore `onSnapshot`.

This means:

- messages appear in real time
- conversation lists update when lastMessage changes
- no custom WebSocket server is needed for MVP

## Current Screens

- `src/app/client/(tabs)/messages.jsx`
- `src/app/client/conversation/[conversationId].jsx`
- `src/app/barber/(tabs)/messages.jsx`
- `src/app/barber/conversation/[conversationId].jsx`

## Current Security Direction

- only participants can read a conversation
- only participants can read messages
- only participants can create messages
- senderId must match the logged-in user
- deletion is disabled

## Future Messaging Work

- unread counts
- read receipts
- typing indicators
- push notifications
- message timestamps in UI
- image messages
- better chat styling
- AI summaries of conversations
- barber-private client notes connected to conversation history
