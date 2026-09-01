export function required(value) {
  return value !== undefined && value !== null && String(value).trim() !== "";
}

export function validEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

export function humanizeFirebaseError(error) {
  const code = error?.code || "";
  const map = {
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/wrong-password": "Incorrect email or password.",
    "auth/user-not-found": "No account was found for this email address.",
    "auth/user-disabled": "This account has been disabled. Contact the scholarship administrator.",
    "auth/email-already-in-use": "An account already exists for this email address.",
    "auth/weak-password": "Use a stronger password with at least 6 characters.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "profile/no-auth-user": "Your login session could not be established. Please sign in again.",
    "profile/create-failed": "Your account was authenticated, but the student database profile could not be created. Publish the included Firebase Realtime Database rules and try again.",
    "profile/load-failed": "Your account was authenticated, but the scholarship profile could not be loaded. Check the Firebase Realtime Database rules and connection.",
    PERMISSION_DENIED: "Your account was authenticated, but Firebase Realtime Database denied access. Publish the included database.rules.json file in Firebase Console.",
  };

  if (map[code]) return map[code];

  const message = String(error?.message || "");
  if (message.includes("PERMISSION_DENIED") || message.includes("permission_denied")) {
    return "Firebase Realtime Database denied access to your user profile. Publish the included database.rules.json rules, then sign in again.";
  }

  return message || "Something went wrong. Please try again.";
}
