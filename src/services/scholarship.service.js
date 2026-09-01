import { get, push, ref, update } from "firebase/database";
import { db } from "../config/firebase";
import { writeAuditLog } from "./audit.service";
function cleanScholarship(input) {
    return {
        title: String(input.title || "").trim(),
        code: String(input.code || "").trim().toUpperCase(),
        category: String(input.category || "General Scholarship").trim(),
        description: String(input.description || "").trim(),
        benefits: String(input.benefits || "").trim(),
        eligibility: String(input.eligibility || "").trim(),
        academicYear: String(input.academicYear || "").trim(),
        semester: String(input.semester || "").trim(),
        amount: Number(input.amount || 0),
        maxApplicants: Math.max(1, Number(input.maxApplicants || 1)),
        openDate: input.openDate || "",
        closeDate: input.closeDate || "",
        openAt: input.openDate ? new Date(`${input.openDate}T00:00:00`).getTime() : 0,
        closeAt: input.closeDate ? new Date(`${input.closeDate}T23:59:59`).getTime() : 0,
        requirements: Array.isArray(input.requirements)
            ? input.requirements.map((item) => String(item).trim()).filter(Boolean)
            : [],
        customQuestions: Array.isArray(input.customQuestions)
            ? input.customQuestions.map((question, index) => ({
                id: question.id || `question_${Date.now()}_${index}`,
                label: String(question.label || "").trim(),
                type: question.type || "text",
                required: Boolean(question.required),
                options: Array.isArray(question.options)
                    ? question.options.map((option) => String(option).trim()).filter(Boolean)
                    : [],
            })).filter((question) => question.label)
            : [],
        requirePhoto: input.requirePhoto !== false,
        requireSignature: input.requireSignature !== false,
        status: input.status === "published" ? "published" : input.status === "archived" ? "archived" : "draft",
    };
}
export async function createScholarship(input, adminUid) {
    const id = push(ref(db, "scholarships")).key;
    const now = Date.now();
    const scholarship = {
        id,
        ...cleanScholarship(input),
        createdBy: adminUid,
        createdAt: now,
        updatedAt: now,
    };
    const updates = {
        [`scholarships/${id}`]: scholarship,
    };
    updates[`publicScholarships/${id}`] = scholarship.status === "published" ? scholarship : null;
    await update(ref(db), updates);
    void writeAuditLog({ actorUid: adminUid, actorName: "Administrator", action: "CREATE_SCHOLARSHIP", entityType: "scholarship", entityId: id, detail: scholarship.title }).catch(console.error);
    return scholarship;
}
export async function updateScholarship(id, input, adminUid) {
    const currentSnapshot = await get(ref(db, `scholarships/${id}`));
    if (!currentSnapshot.exists())
        throw new Error("Scholarship not found.");
    const current = currentSnapshot.val();
    const scholarship = {
        ...current,
        ...cleanScholarship(input),
        id,
        updatedBy: adminUid,
        updatedAt: Date.now(),
    };
    const updates = {
        [`scholarships/${id}`]: scholarship,
        [`publicScholarships/${id}`]: scholarship.status === "published" ? scholarship : null,
    };
    await update(ref(db), updates);
    void writeAuditLog({ actorUid: adminUid, actorName: "Administrator", action: "UPDATE_SCHOLARSHIP", entityType: "scholarship", entityId: id, detail: scholarship.title }).catch(console.error);
    return scholarship;
}
export async function archiveScholarship(id, adminUid) {
    const snapshot = await get(ref(db, `scholarships/${id}`));
    if (!snapshot.exists())
        return;
    const scholarship = {
        ...snapshot.val(),
        status: "archived",
        updatedBy: adminUid,
        updatedAt: Date.now(),
    };
    await update(ref(db), {
        [`scholarships/${id}`]: scholarship,
        [`publicScholarships/${id}`]: null,
    });
    void writeAuditLog({ actorUid: adminUid, actorName: "Administrator", action: "ARCHIVE_SCHOLARSHIP", entityType: "scholarship", entityId: id, detail: scholarship.title }).catch(console.error);
}
export async function getPublicScholarships() {
    const snapshot = await get(ref(db, "publicScholarships"));
    if (!snapshot.exists())
        return [];
    return Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
}
export async function getPublicScholarship(id) {
    const snapshot = await get(ref(db, `publicScholarships/${id}`));
    return snapshot.exists() ? { id, ...snapshot.val() } : null;
}
export async function getAdminScholarships() {
    const snapshot = await get(ref(db, "scholarships"));
    if (!snapshot.exists())
        return [];
    return Object.entries(snapshot.val()).map(([id, value]) => ({ id, ...value }));
}
export async function getAdminScholarship(id) {
    const snapshot = await get(ref(db, `scholarships/${id}`));
    return snapshot.exists() ? { id, ...snapshot.val() } : null;
}
export async function countApplicationsForScholarship(scholarshipId) {
    const snapshot = await get(ref(db, `applications/${scholarshipId}`));
    return snapshot.exists() ? snapshot.size : 0;
}

