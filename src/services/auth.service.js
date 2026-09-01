import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { get, ref, update } from "firebase/database";
import { auth, db } from "../config/firebase";

function cleanEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function fallbackName(user) {
  if (user?.displayName?.trim()) return user.displayName.trim();
  const emailPrefix = String(user?.email || "Student").split("@")[0];
  return emailPrefix
    .replace(/[._-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .trim() || "Student";
}

/**
 * Ensures every authenticated Firebase user has a valid RTDB profile.
 *
 * This is important because an account can exist in Firebase Authentication
 * without a corresponding /users/{uid} record (for example, when the account
 * was created manually in Firebase Console). Missing profiles are safely
 * recovered as STUDENT profiles. Existing admin roles are never downgraded.
 */
export async function ensureUserProfile(
  user,
  { fullName = "", phone = "", defaultRole = "student" } = {},
) {
  if (!user?.uid) {
    const error = new Error("No authenticated Firebase user is available.");
    error.code = "profile/no-auth-user";
    throw error;
  }

  const userRef = ref(db, `users/${user.uid}`);
  const snapshot = await get(userRef);
  const existing = snapshot.exists() ? snapshot.val() : null;

  // Never promote a user from the browser. The only automatic role is student.
  // Existing administrator records remain administrators.
  const role = existing?.role === "admin" ? "admin" : defaultRole === "student" ? "student" : "student";
  const now = Date.now();

  const profile = {
    ...(existing || {}),
    uid: user.uid,
    fullName:
      String(existing?.fullName || fullName || fallbackName(user)).trim() ||
      "Student",
    email: cleanEmail(user.email || existing?.email),
    phone: String(existing?.phone ?? phone ?? "").trim(),
    address: String(existing?.address || "").trim(),
    barangay: String(existing?.barangay || "").trim(),
    role,
    createdAt: Number(existing?.createdAt) || now,
    updatedAt: now,
  };

  // Normalize old/minimal records as well as create missing profiles.
  // update() preserves any extra profile fields already stored by the system.
  await update(userRef, profile);
  return profile;
}

export async function registerStudent({
  fullName,
  email,
  password,
  phone = "",
}) {
  const normalizedEmail = cleanEmail(email);
  const credential = await createUserWithEmailAndPassword(
    auth,
    normalizedEmail,
    password,
  );

  await updateProfile(credential.user, {
    displayName: String(fullName || "").trim(),
  });

  try {
    const profile = await ensureUserProfile(credential.user, {
      fullName,
      phone,
      defaultRole: "student",
    });

    return { user: credential.user, profile };
  } catch (error) {
    // Avoid leaving a confusing half-authenticated browser session if RTDB
    // security rules or database configuration prevent profile creation.
    await signOut(auth).catch(() => undefined);
    if (!error.code) error.code = "profile/create-failed";
    throw error;
  }
}

/**
 * Authenticates the user AND resolves their RTDB role/profile before returning.
 * This eliminates the former race where the UI navigated to /student before
 * AuthContext had received the Firebase auth-state callback.
 */
export async function login(email, password) {
  const credential = await signInWithEmailAndPassword(
    auth,
    cleanEmail(email),
    password,
  );

  try {
    const profile = await ensureUserProfile(credential.user);
    return { user: credential.user, profile };
  } catch (error) {
    await signOut(auth).catch(() => undefined);
    if (!error.code) error.code = "profile/load-failed";
    throw error;
  }
}

export async function logout() {
  return signOut(auth);
}

export async function getUserProfile(uid) {
  if (!uid) return null;
  const snapshot = await get(ref(db, `users/${uid}`));
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateOwnProfile(uid, values) {
  const safeValues = {
    fullName: String(values.fullName || "").trim(),
    phone: String(values.phone || "").trim(),
    address: String(values.address || "").trim(),
    barangay: String(values.barangay || "").trim(),
    updatedAt: Date.now(),
  };

  await update(ref(db, `users/${uid}`), safeValues);
  return safeValues;
}
