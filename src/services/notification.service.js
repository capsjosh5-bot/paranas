import { get, onValue, ref, update, push } from "firebase/database";
import { db } from "../config/firebase";

export function subscribeNotifications(uid, callback) {
  return onValue(ref(db, `notifications/${uid}`), (snapshot) => {
    const items = snapshot.exists()
      ? Object.entries(snapshot.val())
          .map(([id, value]) => ({ id, ...value }))
          .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      : [];
    callback(items);
  });
}

export async function createScholarshipNotifications(scholarship) {
  const usersSnapshot = await get(ref(db, "users"));
  if (!usersSnapshot.exists()) return;

  const updates = {};
  const now = Date.now();

  Object.entries(usersSnapshot.val()).forEach(([uid, user]) => {
    if (user.role === "student") {
      const notificationRef = push(ref(db, `notifications/${uid}`));
      updates[`notifications/${uid}/${notificationRef.key}`] = {
        title: "New Scholarship Available",
        message: `${scholarship.title} is now available for application.`,
        type: "NEW_SCHOLARSHIP",
        scholarshipId: scholarship.id,
        read: false,
        createdAt: now,
      };
    }
  });

  if (Object.keys(updates).length) {
    await update(ref(db), updates);
  }
}

export async function getNotifications(uid) {
  const snapshot = await get(ref(db, `notifications/${uid}`));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val())
    .map(([id, value]) => ({ id, ...value }))
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

export async function markNotificationRead(uid, id) {
  await update(ref(db, `notifications/${uid}/${id}`), { read: true, readAt: Date.now() });
}

export async function markAllNotificationsRead(uid, notifications) {
  const updates = {};
  notifications.forEach((notification) => {
    if (!notification.read) {
      updates[`notifications/${uid}/${notification.id}/read`] = true;
      updates[`notifications/${uid}/${notification.id}/readAt`] = Date.now();
    }
  });
  if (Object.keys(updates).length) await update(ref(db), updates);
}
