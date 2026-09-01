import { get, onValue, ref, update } from "firebase/database";
import { db } from "../config/firebase";
export function subscribeNotifications(uid, callback) {
    return onValue(ref(db, `notifications/${uid}`), (snapshot) => {
        const items = snapshot.exists()
            ? Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
            : [];
        callback(items);
    });
}
export async function getNotifications(uid) {
    const snapshot = await get(ref(db, `notifications/${uid}`));
    if (!snapshot.exists())
        return [];
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
    if (Object.keys(updates).length)
        await update(ref(db), updates);
}

