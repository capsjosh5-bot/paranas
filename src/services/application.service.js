import { get, onValue, ref, update } from "firebase/database";
import { db } from "../config/firebase";
import { writeAuditLog } from "./audit.service";
function applicationPath(scholarshipId, uid) {
    return `applications/${scholarshipId}/${uid}`;
}
export async function submitApplication({ scholarship, user, profile, formData, photoDataUrl, signatureDataUrl }) {
    const existing = await get(ref(db, applicationPath(scholarship.id, user.uid)));
    if (existing.exists()) {
        throw new Error("You already have an application for this scholarship.");
    }
    const now = Date.now();
    const application = {
        id: user.uid,
        applicantUid: user.uid,
        scholarshipId: scholarship.id,
        scholarshipTitle: scholarship.title,
        scholarshipCode: scholarship.code || "",
        applicantName: formData.student?.fullName || profile?.fullName || user.displayName || "Applicant",
        applicantEmail: user.email || profile?.email || "",
        status: "pending",
        submittedAt: now,
        updatedAt: now,
        formData,
        photoDataUrl: photoDataUrl || "",
        signatureDataUrl: signatureDataUrl || "",
        signatureAudit: {
            signedByUid: user.uid,
            signedByEmail: user.email || "",
            signedAt: now,
            userAgent: navigator.userAgent.slice(0, 400),
        },
        adminReview: {
            assessment: "",
            remarks: "",
            reviewedAt: null,
            reviewedBy: "",
            reviewedByName: "",
            approvalSignatureDataUrl: "",
            approvalSignatoryName: "",
            approvalSignatoryTitle: "",
            approvalSignatureAuthorized: false,
            approvalSignedAt: null,
        },
        statusHistory: {
            [String(now)]: {
                status: "pending",
                label: "Application submitted",
                actorUid: user.uid,
                timestamp: now,
            },
        },
    };
    await update(ref(db), {
        [applicationPath(scholarship.id, user.uid)]: application,
        [`userApplicationIndex/${user.uid}/${scholarship.id}`]: { scholarshipId: scholarship.id, scholarshipTitle: scholarship.title, createdAt: now },
    });
    return application;
}
export async function resubmitApplication({ scholarshipId, user, formData, photoDataUrl, signatureDataUrl }) {
    const path = applicationPath(scholarshipId, user.uid);
    const snapshot = await get(ref(db, path));
    if (!snapshot.exists())
        throw new Error("Application not found.");
    const current = snapshot.val();
    if (current.status !== "revision_required") {
        throw new Error("This application is not currently open for revision.");
    }
    const now = Date.now();
    const updates = {
        formData,
        photoDataUrl: photoDataUrl || current.photoDataUrl || "",
        signatureDataUrl: signatureDataUrl || current.signatureDataUrl || "",
        status: "pending",
        updatedAt: now,
        resubmittedAt: now,
        [`statusHistory/${now}`]: {
            status: "pending",
            label: "Revised application resubmitted",
            actorUid: user.uid,
            timestamp: now,
        },
    };
    await update(ref(db, path), updates);
    return { ...current, ...updates };
}
export function subscribeOwnApplication(scholarshipId, uid, callback) {
    return onValue(ref(db, applicationPath(scholarshipId, uid)), (snapshot) => {
        callback(snapshot.exists() ? snapshot.val() : null);
    });
}
export async function getOwnApplication(scholarshipId, uid) {
    const snapshot = await get(ref(db, applicationPath(scholarshipId, uid)));
    return snapshot.exists() ? snapshot.val() : null;
}
export async function getOwnApplications(uid) {
    const indexSnapshot = await get(ref(db, `userApplicationIndex/${uid}`));
    if (!indexSnapshot.exists())
        return [];
    const scholarshipIds = Object.keys(indexSnapshot.val());
    const results = await Promise.all(scholarshipIds.map(async (scholarshipId) => {
        const application = await getOwnApplication(scholarshipId, uid);
        return application ? application : null;
    }));
    return results.filter(Boolean).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
export async function getAllApplications() {
    const snapshot = await get(ref(db, "applications"));
    if (!snapshot.exists())
        return [];
    const rows = [];
    snapshot.forEach((scholarshipNode) => {
        scholarshipNode.forEach((applicationNode) => {
            rows.push({
                ...applicationNode.val(),
                scholarshipId: scholarshipNode.key,
                applicantUid: applicationNode.key,
            });
        });
    });
    return rows.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}
export async function getApplicationForAdmin(scholarshipId, uid) {
    const snapshot = await get(ref(db, applicationPath(scholarshipId, uid)));
    return snapshot.exists() ? snapshot.val() : null;
}
export async function reviewApplication({ scholarshipId, applicantUid, status, assessment, remarks, adminUid, adminName, approvalSignatureDataUrl = "", approvalSignatoryName = "", approvalSignatoryTitle = "", approvalSignatureAuthorized = false }) {
    const path = applicationPath(scholarshipId, applicantUid);
    const snapshot = await get(ref(db, path));
    if (!snapshot.exists())
        throw new Error("Application not found.");
    const current = snapshot.val();
    const now = Date.now();
    const notificationKey = `${now}_${Math.random().toString(36).slice(2, 8)}`;
    const statusLabels = {
        pending: "Pending Review",
        revision_required: "For Revision",
        approved: "Approved",
        rejected: "Rejected",
    };
    const updates = {
        [`${path}/status`]: status,
        [`${path}/updatedAt`]: now,
        [`${path}/adminReview`]: {
            assessment: String(assessment || "").trim(),
            remarks: String(remarks || "").trim(),
            reviewedAt: now,
            reviewedBy: adminUid,
            reviewedByName: adminName || "Administrator",
            approvalSignatureDataUrl: status === "approved" ? String(approvalSignatureDataUrl || "") : "",
            approvalSignatoryName: status === "approved" ? String(approvalSignatoryName || "HON. ELVIRA U. BABALCON").trim() : "",
            approvalSignatoryTitle: status === "approved" ? String(approvalSignatoryTitle || "Municipal Mayor").trim() : "",
            approvalSignatureAuthorized: status === "approved" ? approvalSignatureAuthorized === true : false,
            approvalSignedAt: status === "approved" ? now : null,
        },
        [`${path}/statusHistory/${now}`]: {
            status,
            label: `Application marked ${statusLabels[status] || status}`,
            actorUid: adminUid,
            timestamp: now,
        },
        [`notifications/${applicantUid}/${notificationKey}`]: {
            id: notificationKey,
            type: status === "revision_required"
                ? "APPLICATION_REVISION"
                : status === "rejected"
                    ? "APPLICATION_DECLINED"
                    : status === "approved"
                        ? "APPLICATION_APPROVED"
                        : "APPLICATION_STATUS",
            applicationId: `${scholarshipId}/${applicantUid}`,
            adminComment: String(remarks || "").trim(),
            title: `Application ${statusLabels[status] || status}`,
            message: status === "revision_required"
                ? remarks || "Your application requires revisions. Please review the administrator remarks and resubmit."
                : status === "approved"
                    ? `Your application for ${current.scholarshipTitle} has been approved.`
                    : status === "rejected"
                        ? remarks || `Your application for ${current.scholarshipTitle} was not approved.`
                        : `Your application status for ${current.scholarshipTitle} was updated.`,
            scholarshipId,
            createdAt: now,
            read: false,
        },
    };
    await update(ref(db), updates);
    void writeAuditLog({ actorUid: adminUid, actorName: adminName || "Administrator", action: "REVIEW_APPLICATION", entityType: "application", entityId: `${scholarshipId}/${applicantUid}`, detail: `${current.scholarshipTitle} → ${statusLabels[status] || status}` }).catch(console.error);
}

