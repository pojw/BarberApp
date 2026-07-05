import { doc, getDoc,updateDoc,serverTimestamp } from "firebase/firestore";
import { auth, db
 } from "../config/firebase";

export async function getClientHairProfileState(clientId) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  const clientRef = doc(db, "clients", clientId);
  const clientSnap = await getDoc(clientRef);

  if (!clientSnap.exists()) {
    return {
      hasConfirmedProfile: false,
      activeProfileId: null,
      lastAnalyzedAt: null,
    };
  }

  const clientData = clientSnap.data();

  return {
    hasConfirmedProfile:
      clientData?.aiHairProfile?.hasConfirmedProfile ?? false,
    activeProfileId:
      clientData?.aiHairProfile?.activeProfileId ?? null,
    lastAnalyzedAt:
      clientData?.aiHairProfile?.lastAnalyzedAt ?? null,
  };
}


import { AI_API_BASE_URL } from "../config/api";

export async function analyzeHairProfile({ clientId, photoAngles }) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!photoAngles || photoAngles.length === 0) {
    throw new Error("Select at least one photo angle");
  }

  const token = await auth.currentUser?.getIdToken();

  const response = await fetch(`${AI_API_BASE_URL}/vision/analyze-profile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({
      clientId,
      photoAngles,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to analyze hair profile");
  }

  return await response.json();
}


export async function getHairProfile({ clientId, profileId }) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!profileId) {
    throw new Error("Missing profileId");
  }

  const profileRef = doc(
    db,
    "clients",
    clientId,
    "hairProfiles",
    profileId
  );

  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) {
    throw new Error("Hair profile not found");
  }

  return {
    id: profileSnap.id,
    ...profileSnap.data(),
  };
}

export async function getActiveHairProfile(clientId) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  const hairProfileState = await getClientHairProfileState(clientId);

  if (
    !hairProfileState.hasConfirmedProfile ||
    !hairProfileState.activeProfileId
  ) {
    return null;
  }

  return await getHairProfile({
    clientId,
    profileId: hairProfileState.activeProfileId,
  });
}
export async function confirmHairProfile({
  clientId,
  profileId,
  confirmedProfile,
  originalAiPrediction,
}) {
  if (!clientId) {
    throw new Error("Missing clientId");
  }

  if (!profileId) {
    throw new Error("Missing profileId");
  }

  if (!confirmedProfile) {
    throw new Error("Missing confirmedProfile");
  }

  const editedFields = getEditedFields({
    originalAiPrediction,
    confirmedProfile,
  });

  const profileRef = doc(
    db,
    "clients",
    clientId,
    "hairProfiles",
    profileId
  );

  const clientRef = doc(db, "clients", clientId);

  await updateDoc(profileRef, {
    confirmedProfile,
    status: "confirmed",
    wasEditedByUser: editedFields.length > 0,
    editedFields,
    updatedAt: serverTimestamp(),
  });

  await updateDoc(clientRef, {
    aiHairProfile: {
      hasConfirmedProfile: true,
      activeProfileId: profileId,
      lastAnalyzedAt: serverTimestamp(),
    },
  });

  return {
    profileId,
    confirmedProfile,
    editedFields,
  };
}
function getEditedFields({
  originalAiPrediction,
  confirmedProfile,
}) {
  if (!originalAiPrediction || !confirmedProfile) {
    return [];
  }

  const editableOriginal = buildEditableHairProfile(
    originalAiPrediction
  );

  const editedFields = [];

  Object.keys(confirmedProfile).forEach((fieldName) => {
    const originalValue = editableOriginal[fieldName];
    const confirmedValue = confirmedProfile[fieldName];

    if (
      String(originalValue ?? "") !==
      String(confirmedValue ?? "")
    ) {
      editedFields.push(fieldName);
    }
  });

  return editedFields;
}

export function buildEditableHairProfile(originalAiPrediction) {
  if (!originalAiPrediction) {
    return {};
  }


  return {
    overallLengthCategory:
      originalAiPrediction.hair?.overallLengthCategory ?? "",

    frontLengthInches:
      originalAiPrediction.hair?.frontLengthInches ?? "",

    sideLengthInches:
      originalAiPrediction.hair?.sideLengthInches ?? "",

    backLengthInches:
      originalAiPrediction.hair?.backLengthInches ?? "",

    texture:
      originalAiPrediction.hair?.texture ?? "",

    density:
      originalAiPrediction.hair?.density ?? "",

    currentStyle:
      originalAiPrediction.hair?.currentStyle ?? "",

    faceShape:
      originalAiPrediction.face?.shape ?? "",

    facialHair:
      originalAiPrediction.face?.facialHair ?? "",

    hasFadeOrTaper:
      originalAiPrediction.cutDetails?.hasFadeOrTaper ?? false,

    fadeType:
      originalAiPrediction.cutDetails?.fadeType ?? "",

    neckline:
      originalAiPrediction.cutDetails?.neckline ?? "",

    earCoverage:
      originalAiPrediction.cutDetails?.earCoverage ?? "",
  };
}
