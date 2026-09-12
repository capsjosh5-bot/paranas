import { get, ref } from "firebase/database";
import { db } from "../config/firebase";

function asObject(value) {
  return value && typeof value === "object" ? value : {};
}

function toTimestamp(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;

  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizedRole(value) {
  const role = String(value || "student").trim().toLowerCase();
  if (["admin", "administrator"].includes(role)) return "admin";
  if (["personnel", "staff", "employee"].includes(role)) return "personnel";
  if (["student", "applicant", "user"].includes(role)) return "student";
  return role || "student";
}

function normalizeUsers(rawUsers) {
  const source = asObject(rawUsers);
  return Object.entries(source)
    .map(([uid, raw]) => {
      const value = asObject(raw);
      return {
        ...value,
        uid: value.uid || uid,
        role: normalizedRole(value.role || value.userType || value.accountType),
        fullName:
          value.fullName ||
          value.name ||
          value.displayName ||
          value.studentName ||
          value.personnelName ||
          "",
        email: value.email || value.emailAddress || "",
        barangay: value.barangay || value.address?.barangay || "",
        createdAt: toTimestamp(value.createdAt || value.registeredAt || value.dateCreated),
        updatedAt: toTimestamp(value.updatedAt || value.modifiedAt || value.createdAt),
      };
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

function normalizeScholarships(rawScholarships) {
  return Object.entries(asObject(rawScholarships))
    .map(([id, raw]) => {
      const value = asObject(raw);
      return {
        ...value,
        id: value.id || id,
        title: value.title || value.name || value.scholarshipTitle || "Untitled scholarship",
        code: value.code || value.scholarshipCode || "",
        status: String(value.status || "draft").toLowerCase(),
        maxApplicants: Math.max(
          0,
          Number(value.maxApplicants ?? value.maximumApplicants ?? value.capacity ?? value.slots ?? 0) || 0,
        ),
        createdAt: toTimestamp(value.createdAt || value.dateCreated),
        updatedAt: toTimestamp(value.updatedAt || value.modifiedAt || value.createdAt),
      };
    })
    .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

function looksLikeApplication(value) {
  if (!value || typeof value !== "object") return false;
  return Boolean(
    value.applicantUid ||
      value.scholarshipId ||
      value.scholarshipTitle ||
      value.formData ||
      value.status ||
      value.submittedAt,
  );
}

function normalizeOneApplication(raw, scholarshipId, applicantUid, scholarshipLookup, userLookup) {
  const value = asObject(raw);
  const resolvedScholarshipId = value.scholarshipId || scholarshipId || "";
  const resolvedApplicantUid = value.applicantUid || value.uid || value.userId || applicantUid || "";
  const scholarship = scholarshipLookup.get(resolvedScholarshipId);
  const user = userLookup.get(resolvedApplicantUid);
  const student = asObject(value.formData?.student);

  return {
    ...value,
    id: value.id || resolvedApplicantUid || `${resolvedScholarshipId}_${resolvedApplicantUid}`,
    scholarshipId: resolvedScholarshipId,
    applicantUid: resolvedApplicantUid,
    scholarshipTitle:
      value.scholarshipTitle ||
      scholarship?.title ||
      value.programTitle ||
      "Scholarship program",
    scholarshipCode: value.scholarshipCode || scholarship?.code || "",
    applicantName:
      value.applicantName ||
      student.fullName ||
      student.name ||
      user?.fullName ||
      "Applicant",
    applicantEmail:
      value.applicantEmail ||
      student.email ||
      user?.email ||
      "",
    status: String(value.status || value.applicationStatus || "pending").toLowerCase(),
    submittedAt: toTimestamp(
      value.submittedAt || value.createdAt || value.applicationDate || value.dateSubmitted,
    ),
    updatedAt: toTimestamp(
      value.updatedAt || value.reviewedAt || value.modifiedAt || value.submittedAt || value.createdAt,
    ),
  };
}

function normalizeApplications(rawApplications, scholarships, users) {
  const source = asObject(rawApplications);
  const scholarshipLookup = new Map(scholarships.map((item) => [item.id, item]));
  const userLookup = new Map(users.map((item) => [item.uid, item]));
  const rows = [];

  Object.entries(source).forEach(([firstKey, firstValue]) => {
    if (looksLikeApplication(firstValue)) {
      rows.push(
        normalizeOneApplication(
          firstValue,
          firstValue.scholarshipId || "",
          firstValue.applicantUid || firstKey,
          scholarshipLookup,
          userLookup,
        ),
      );
      return;
    }

    Object.entries(asObject(firstValue)).forEach(([secondKey, secondValue]) => {
      if (!looksLikeApplication(secondValue)) return;
      rows.push(
        normalizeOneApplication(
          secondValue,
          firstKey,
          secondKey,
          scholarshipLookup,
          userLookup,
        ),
      );
    });
  });

  return rows.sort((a, b) => (b.updatedAt || b.submittedAt || 0) - (a.updatedAt || a.submittedAt || 0));
}

function normalizeAuditLogs(rawAuditLogs) {
  return Object.entries(asObject(rawAuditLogs))
    .map(([id, raw]) => {
      const value = asObject(raw);
      return {
        ...value,
        id: value.id || id,
        actorName: value.actorName || value.adminName || value.userName || "Administrator",
        action: value.action || value.event || value.type || "SYSTEM_ACTIVITY",
        detail: value.detail || value.description || value.message || "",
        createdAt: toTimestamp(value.createdAt || value.timestamp || value.date || value.updatedAt),
      };
    })
    .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
}

async function readBranch(path) {
  const snapshot = await get(ref(db, path));
  return snapshot.exists() ? snapshot.val() : null;
}

function errorMessage(error) {
  return String(error?.message || error || "Unknown Firebase read error");
}

/**
 * Loads every report source independently.
 * A permission/index problem in one branch will no longer erase all other data.
 */
export async function getSystemReportData() {
  const sources = ["users", "scholarships", "applications", "auditLogs"];
  const settled = await Promise.allSettled(sources.map((path) => readBranch(path)));
  const raw = {};
  const warnings = [];

  settled.forEach((result, index) => {
    const path = sources[index];
    if (result.status === "fulfilled") {
      raw[path] = result.value;
    } else {
      raw[path] = null;
      warnings.push({ source: path, message: errorMessage(result.reason) });
      console.error(`Unable to load report source: ${path}`, result.reason);
    }
  });

  const users = normalizeUsers(raw.users);
  const scholarships = normalizeScholarships(raw.scholarships);
  const applications = normalizeApplications(raw.applications, scholarships, users);
  const auditLogs = normalizeAuditLogs(raw.auditLogs);

  return {
    users,
    scholarships,
    applications,
    auditLogs,
    warnings,
  };
}

export async function getAdminUsers() {
  const rawUsers = await readBranch("users");
  return normalizeUsers(rawUsers);
}

export function buildReportMetrics({ users = [], scholarships = [], applications = [] }) {
  const students = users.filter((item) => normalizedRole(item.role) === "student");
  const personnel = users.filter((item) => normalizedRole(item.role) === "personnel");
  const admins = users.filter((item) => normalizedRole(item.role) === "admin");
  const otherUsers = Math.max(0, users.length - students.length - personnel.length - admins.length);

  const published = scholarships.filter((item) => String(item.status).toLowerCase() === "published");
  const draft = scholarships.filter((item) => String(item.status).toLowerCase() === "draft");
  const archived = scholarships.filter((item) => String(item.status).toLowerCase() === "archived");

  const statusCount = (status) =>
    applications.filter((item) => String(item.status).toLowerCase() === status).length;

  const capacityPrograms = published.length ? published : scholarships.filter((item) => String(item.status).toLowerCase() !== "archived");
  const totalCapacity = capacityPrograms.reduce(
    (sum, item) => sum + Math.max(0, Number(item.maxApplicants || 0)),
    0,
  );
  const usedCapacity = capacityPrograms.reduce((sum, item) => {
    const used = applications.filter((application) => application.scholarshipId === item.id).length;
    return sum + used;
  }, 0);

  const approved = statusCount("approved");
  const pending = statusCount("pending");
  const revision = statusCount("revision_required");
  const rejected = statusCount("rejected");

  return {
    users: users.length,
    students: students.length,
    personnel: personnel.length,
    admins: admins.length,
    otherUsers,
    scholarships: scholarships.length,
    published: published.length,
    draft: draft.length,
    archived: archived.length,
    applications: applications.length,
    pending,
    revision,
    approved,
    rejected,
    notApproved: Math.max(0, applications.length - approved),
    totalCapacity,
    usedCapacity,
    availableSlots: Math.max(0, totalCapacity - usedCapacity),
  };
}

export function buildScholarshipReportRows(scholarships = [], applications = []) {
  return scholarships.map((program) => {
    const programApplications = applications.filter((item) => item.scholarshipId === program.id);
    const maximum = Math.max(0, Number(program.maxApplicants || 0));
    const used = programApplications.length;
    const available = Math.max(0, maximum - used);
    const approved = programApplications.filter((item) => item.status === "approved").length;
    const pending = programApplications.filter((item) => item.status === "pending").length;
    const revision = programApplications.filter((item) => item.status === "revision_required").length;
    const rejected = programApplications.filter((item) => item.status === "rejected").length;
    const utilization = maximum ? Math.min(100, Math.round((used / maximum) * 100)) : 0;

    return {
      ...program,
      maximum,
      used,
      available,
      approved,
      pending,
      revision,
      rejected,
      utilization,
    };
  });
}
