import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";

import { db } from "../config/firebase";



export function buildConversationId(clientId, barberId) {
  return `${clientId}_${barberId}`;
}

export async function getOrCreateConversation({
  clientId,
  barberId,
  clientName,
  barberName,
  businessName,
}) {
  if (!clientId || !barberId) {
    throw new Error("Missing clientId or barberId.");
  }

  const conversationId = buildConversationId(clientId, barberId);
  const conversationRef = doc(db, "conversations", conversationId);

  const conversationSnap = await getDoc(conversationRef);

  if (conversationSnap.exists()) {
    return {
      id: conversationSnap.id,
      ...conversationSnap.data(),
    };
  }

  const newConversation = {
    participants: [clientId, barberId],

    clientId,
    barberId,

    clientName: clientName || "Client",
    barberName: barberName || "Barber",
    businessName: businessName || "",

    lastMessage: "",
    lastMessageAt: null,

    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(conversationRef, newConversation);

  return {
    id: conversationId,
    ...newConversation,
  };
}

export async function sendMessage({
  conversationId,
  senderId,
  senderName,
  text,
}) {
  const trimmedText = text?.trim();

  if (!conversationId) {
    throw new Error("Missing conversationId.");
  }

  if (!senderId) {
    throw new Error("Missing senderId.");
  }

  if (!trimmedText) {
    throw new Error("Message cannot be empty.");
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  await addDoc(messagesRef, {
    senderId,
    senderName: senderName || "User",
    text: trimmedText,
    createdAt: serverTimestamp(),
  });

  const conversationRef = doc(db, "conversations", conversationId);

  await updateDoc(conversationRef, {
    lastMessage: trimmedText,
    lastMessageAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getConversationById(conversationId) {
  if (!conversationId) {
    throw new Error("Missing conversationId.");
  }

  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    return null;
  }

  return {
    id: conversationSnap.id,
    ...conversationSnap.data(),
  };
}

export async function getConversationsForUser(userId) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const conversationsRef = collection(db, "conversations");

  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
}

export function listenToUserConversations(userId, callback, errorCallback) {
  if (!userId) {
    throw new Error("Missing userId.");
  }

  const conversationsRef = collection(db, "conversations");

  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("updatedAt", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const conversations = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      callback(conversations);
    },
    (error) => {
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
}

export function listenToConversationMessages(
  conversationId,
  callback,
  errorCallback
) {
  if (!conversationId) {
    throw new Error("Missing conversationId.");
  }

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const messages = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      callback(messages);
    },
    (error) => {
      if (errorCallback) {
        errorCallback(error);
      }
    }
  );
}