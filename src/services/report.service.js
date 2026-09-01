import { get, ref } from "firebase/database";
import { db } from "../config/firebase";
import { getAllApplications } from "./application.service";
import { getRecentAuditLogs } from "./audit.service";
import { getAdminScholarships } from "./scholarship.service";

export async function getAdminUsers() {
  const snapshot = await get(ref(db, "users"));
  if (!snapshot.exists()) return [];
  return Object.entries(snapshot.val()).map(([uid, value]) => ({ uid, ...value }));
}

export async function getSystemReportData() {
  const [users, scholarships, applications, auditLogs] = await Promise.all([
    getAdminUsers(),
    getAdminScholarships(),
    getAllApplications(),
    getRecentAuditLogs(500),
  ]);

  return {
    users: Array.isArray(users) ? users : [],
    scholarships: Array.isArray(scholarships) ? scholarships : [],
    applications: Array.isArray(applications) ? applications : [],
    auditLogs: Array.isArray(auditLogs) ? auditLogs : [],
  };
}

export function buildReportMetrics({ users = [], scholarships = [], applications = [] }) {
  const students = users.filter((item) => item.role === "student");
  const admins = users.filter((item) => item.role === "admin");
  const published = scholarships.filter((item) => item.status === "published");
  const draft = scholarships.filter((item) => item.status === "draft");
  const archived = scholarships.filter((item) => item.status === "archived");

  const statusCount = (status) => applications.filter((item) => item.status === status).length;
  const totalCapacity = published.reduce((sum, item) => sum + Math.max(0, Number(item.maxApplicants || 0)), 0);
  const usedCapacity = published.reduce((sum, item) => {
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
    admins: admins.length,
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
