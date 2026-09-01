import { get, limitToLast, orderByChild, push, query, ref, set } from "firebase/database";
import { db } from "../config/firebase";
export async function writeAuditLog({ actorUid, actorName, action, entityType, entityId, detail = "" }) {
    const auditRef = push(ref(db, "auditLogs"));
    await set(auditRef, {
        id: auditRef.key,
        actorUid,
        actorName,
        action,
        entityType,
        entityId,
        detail,
        createdAt: Date.now(),
    });
}
export async function getRecentAuditLogs(limit = 100) {
    const snapshot = await get(query(ref(db, "auditLogs"), orderByChild("createdAt"), limitToLast(limit)));
    if (!snapshot.exists())
        return [];
    return Object.entries(snapshot.val())
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

