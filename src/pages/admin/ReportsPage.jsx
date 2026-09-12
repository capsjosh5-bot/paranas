import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Printer,
  RefreshCw,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import {
  buildReportMetrics,
  buildScholarshipReportRows,
  getSystemReportData,
} from "../../services/report.service";
import { formatDate, formatDateTime } from "../../utils/date";

const reportViews = [
  ["full", "Full System Report"],
  ["applications", "Applications Report"],
  ["scholarships", "Scholarship Capacity Report"],
  ["users", "Registered Users Report"],
  ["activity", "Administrative Activity Report"],
];

const emptyData = {
  users: [],
  scholarships: [],
  applications: [],
  auditLogs: [],
};

function asTimestamp(value) {
  if (value == null || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const numeric = Number(value);
  if (Number.isFinite(numeric) && numeric > 0) return numeric;
  const parsed = Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ReportsPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const [view, setView] = useState(
    reportViews.some(([value]) => value === requestedView) ? requestedView : "full",
  );
  const [data, setData] = useState(emptyData);
  const [warnings, setWarnings] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scholarshipId, setScholarshipId] = useState("all");
  const [generatedAt, setGeneratedAt] = useState(Date.now());

  async function load() {
    setLoading(true);
    setLoadError("");
    try {
      const result = await getSystemReportData();
      setData({
        users: result.users || [],
        scholarships: result.scholarships || [],
        applications: result.applications || [],
        auditLogs: result.auditLogs || [],
      });
      setWarnings(result.warnings || []);
      setGeneratedAt(Date.now());
    } catch (error) {
      console.error("Unable to prepare report", error);
      setLoadError(
        error?.message ||
          "The report could not be loaded from Firebase. Check the database connection and admin read permissions.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.classList.add("admin-report-context");
    load();
    return () => document.body.classList.remove("admin-report-context");
  }, []);

  const start = useMemo(
    () => (startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0),
    [startDate],
  );
  const end = useMemo(
    () => (endDate ? new Date(`${endDate}T23:59:59.999`).getTime() : Number.MAX_SAFE_INTEGER),
    [endDate],
  );
  const dateFilterActive = Boolean(startDate || endDate);

  function isInsideCoverage(value) {
    if (!dateFilterActive) return true;
    const timestamp = asTimestamp(value);
    return timestamp > 0 && timestamp >= start && timestamp <= end;
  }

  const filteredApplications = useMemo(
    () =>
      data.applications.filter(
        (item) =>
          isInsideCoverage(item.submittedAt || item.updatedAt) &&
          (scholarshipId === "all" || item.scholarshipId === scholarshipId),
      ),
    [data.applications, start, end, dateFilterActive, scholarshipId],
  );

  const filteredScholarships = useMemo(
    () =>
      scholarshipId === "all"
        ? data.scholarships
        : data.scholarships.filter((item) => item.id === scholarshipId),
    [data.scholarships, scholarshipId],
  );

  const filteredUsers = useMemo(
    () =>
      dateFilterActive
        ? data.users.filter((item) => isInsideCoverage(item.createdAt || item.updatedAt))
        : data.users,
    [data.users, start, end, dateFilterActive],
  );

  const filteredAuditLogs = useMemo(
    () =>
      dateFilterActive
        ? data.auditLogs.filter((item) => isInsideCoverage(item.createdAt))
        : data.auditLogs,
    [data.auditLogs, start, end, dateFilterActive],
  );

  const metrics = useMemo(
    () =>
      buildReportMetrics({
        users: filteredUsers,
        scholarships: filteredScholarships,
        applications: filteredApplications,
      }),
    [filteredUsers, filteredScholarships, filteredApplications],
  );

  const scholarshipRows = useMemo(
    () => buildScholarshipReportRows(filteredScholarships, filteredApplications),
    [filteredScholarships, filteredApplications],
  );

  const reportTitle =
    reportViews.find(([value]) => value === view)?.[1] || "System Report";

  if (loading) return <Loader fullPage label="Loading live report data…" />;

  return (
    <div className="admin-report-page admin-page-pro">
      <PageHeader
        eyebrow="REPORTING"
        title="Reports"
        description="Live reports generated from the current Firebase records for users, scholarships, applications, and administrative activity."
        actions={
          <button className="button button-primary" onClick={() => window.print()}>
            <Printer size={17} /> Print report
          </button>
        }
      />

      {loadError ? (
        <div className="admin-report-source-alert error">
          <strong>Report data could not be loaded.</strong>
          <span>{loadError}</span>
        </div>
      ) : null}

      {warnings.length ? (
        <div className="admin-report-source-alert warning">
          <strong>Some report sections could not be read from Firebase.</strong>
          <span>
            Available data is still shown. Check admin read permissions for:{" "}
            {warnings.map((item) => item.source).join(", ")}.
          </span>
        </div>
      ) : null}

      <section className="admin-report-toolbar admin-panel-pro">
        <div className="admin-report-toolbar-grid">
          <label className="field-label">
            Report type
            <select value={view} onChange={(e) => setView(e.target.value)}>
              {reportViews.map(([value, label]) => (
                <option value={value} key={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            Scholarship
            <select value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value)}>
              <option value="all">All scholarship programs</option>
              {data.scholarships.map((item) => (
                <option value={item.id} key={item.id}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="field-label">
            From
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="field-label">
            To
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <button type="button" className="button button-secondary admin-report-refresh" onClick={load}>
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </section>

      <section className="admin-report-paper">
        <header className="admin-report-header">
          <div className="admin-report-brand">
            <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
            <div>
              <span>LGU SCHOLARSHIP PROGRAM</span>
              <strong>Municipality of Paranas, Samar</strong>
              <small>Scholarship Management System</small>
            </div>
          </div>
          <div className="admin-report-meta">
            <span>LIVE MANAGEMENT REPORT</span>
            <h1>{reportTitle}</h1>
            <p>Generated {formatDateTime(generatedAt)}</p>
            <p>Prepared by {profile?.fullName || "Scholarship Administrator"}</p>
          </div>
        </header>

        <div className="admin-report-filter-note">
          <CalendarDays size={16} />
          <span>
            Coverage: {startDate ? formatDate(startDate) : "All dates"}{" "}
            {endDate ? `to ${formatDate(endDate)}` : ""} ·{" "}
            {scholarshipId === "all"
              ? "All scholarship programs"
              : filteredScholarships[0]?.title || "Selected program"}
          </span>
        </div>

        <div className="admin-report-source-summary">
          <span>Users <strong>{data.users.length}</strong></span>
          <span>Scholarships <strong>{data.scholarships.length}</strong></span>
          <span>Applications <strong>{data.applications.length}</strong></span>
          <span>Activity records <strong>{data.auditLogs.length}</strong></span>
        </div>

        {(view === "full" || view === "applications") && <ReportSummary metrics={metrics} />}

        {(view === "full" || view === "scholarships") && (
          <ReportSection
            title="Scholarship Capacity & Performance"
            subtitle="Applications received, maximum capacity, remaining slots, and decision totals per program."
          >
            <div className="report-table report-scholarship-table">
              <div className="report-row report-head">
                <span>Program</span>
                <span>Status</span>
                <span>Applications</span>
                <span>Maximum</span>
                <span>Available</span>
                <span>Approved</span>
                <span>Pending</span>
              </div>
              {scholarshipRows.length ? (
                scholarshipRows.map((row) => (
                  <div className="report-row" key={row.id}>
                    <span>
                      <strong>{row.title}</strong>
                      <small>{row.code || "LGU Program"}</small>
                    </span>
                    <span>{humanizeStatus(row.status)}</span>
                    <span>{row.used}</span>
                    <span>{row.maximum}</span>
                    <span><strong>{row.available}</strong></span>
                    <span>{row.approved}</span>
                    <span>{row.pending + row.revision}</span>
                  </div>
                ))
              ) : (
                <div className="report-empty-row">No scholarship records were found.</div>
              )}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "applications") && (
          <ReportSection
            title="Application Register"
            subtitle={`${filteredApplications.length} application record${
              filteredApplications.length === 1 ? "" : "s"
            } in the selected coverage.`}
          >
            <div className="report-table report-application-table">
              <div className="report-row report-head">
                <span>Applicant</span>
                <span>Scholarship</span>
                <span>Status</span>
                <span>Submitted</span>
                <span>Updated</span>
              </div>
              {filteredApplications.length ? (
                filteredApplications.map((app, index) => (
                  <div
                    className="report-row"
                    key={`${app.scholarshipId || "program"}-${app.applicantUid || app.id || index}`}
                  >
                    <span>
                      <strong>{app.applicantName || "Applicant"}</strong>
                      <small>{app.applicantEmail || "No email recorded"}</small>
                    </span>
                    <span>
                      <strong>{app.scholarshipTitle || "Scholarship program"}</strong>
                      <small>{app.scholarshipCode || "LGU Program"}</small>
                    </span>
                    <span>{humanizeStatus(app.status)}</span>
                    <span>{app.submittedAt ? formatDateTime(app.submittedAt) : "—"}</span>
                    <span>{app.updatedAt ? formatDateTime(app.updatedAt) : "—"}</span>
                  </div>
                ))
              ) : (
                <div className="report-empty-row">No application records were found for this coverage.</div>
              )}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "users") && (
          <ReportSection
            title="Registered User Accounts"
            subtitle={`${filteredUsers.length} registered account${
              filteredUsers.length === 1 ? "" : "s"
            } in the selected coverage.`}
          >
            <div className="report-table report-user-table">
              <div className="report-row report-head">
                <span>Name</span>
                <span>Email</span>
                <span>Role</span>
                <span>Barangay</span>
              </div>
              {filteredUsers.length ? (
                filteredUsers.map((item, index) => (
                  <div className="report-row" key={item.uid || index}>
                    <span><strong>{item.fullName || "Unnamed user"}</strong></span>
                    <span>{item.email || "—"}</span>
                    <span>{humanizeRole(item.role)}</span>
                    <span>{item.barangay || "—"}</span>
                  </div>
                ))
              ) : (
                <div className="report-empty-row">No user accounts were found.</div>
              )}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "activity") && (
          <ReportSection
            title="Administrative Activity"
            subtitle={`${filteredAuditLogs.length} recorded administrative action${
              filteredAuditLogs.length === 1 ? "" : "s"
            } in the selected coverage.`}
          >
            <div className="report-table report-activity-table">
              <div className="report-row report-head">
                <span>Date</span>
                <span>Administrator</span>
                <span>Action</span>
                <span>Details</span>
              </div>
              {filteredAuditLogs.length ? (
                filteredAuditLogs.map((item, index) => (
                  <div className="report-row" key={item.id || index}>
                    <span>{item.createdAt ? formatDateTime(item.createdAt) : "—"}</span>
                    <span>{item.actorName || "Administrator"}</span>
                    <span>{humanizeAction(item.action)}</span>
                    <span>{item.detail || [item.entityType, item.entityId].filter(Boolean).join(" ") || "—"}</span>
                  </div>
                ))
              ) : (
                <div className="report-empty-row">No administrative activity records were found.</div>
              )}
            </div>
          </ReportSection>
        )}

        <footer className="admin-report-footer">
          <span>LGU Scholarship Program · Municipality of Paranas, Samar</span>
          <span>Generated from live Firebase records</span>
        </footer>
      </section>
    </div>
  );
}

function ReportSummary({ metrics }) {
  const accountNote = [
    `${metrics.students} students`,
    metrics.personnel ? `${metrics.personnel} personnel` : null,
    `${metrics.admins} admins`,
    metrics.otherUsers ? `${metrics.otherUsers} other` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ReportSection title="System Summary" subtitle="Current indicators calculated from the loaded Firebase records.">
      <div className="report-summary-grid">
        <ReportMetric icon={UsersRound} label="Registered Users" value={metrics.users} note={accountNote} />
        <ReportMetric
          icon={GraduationCap}
          label="Published Scholarships"
          value={metrics.published}
          note={`${metrics.scholarships} total programs`}
        />
        <ReportMetric
          icon={FileText}
          label="Applications"
          value={metrics.applications}
          note={`${metrics.notApproved} not approved / still in process`}
        />
        <ReportMetric
          icon={TicketCheck}
          label="Available Slots"
          value={metrics.availableSlots}
          note={`${metrics.usedCapacity} used of ${metrics.totalCapacity}`}
        />
        <ReportMetric
          icon={ClipboardCheck}
          label="Pending Review"
          value={metrics.pending}
          note={`${metrics.revision} for revision`}
        />
        <ReportMetric
          icon={CheckCircle2}
          label="Approved"
          value={metrics.approved}
          note={`${metrics.rejected} rejected`}
        />
      </div>
      <div className="report-status-strip">
        <span><i className="status-mark pending" />Pending <strong>{metrics.pending}</strong></span>
        <span><i className="status-mark revision" />For Revision <strong>{metrics.revision}</strong></span>
        <span><i className="status-mark approved" />Approved <strong>{metrics.approved}</strong></span>
        <span><i className="status-mark rejected" />Rejected <strong>{metrics.rejected}</strong></span>
      </div>
    </ReportSection>
  );
}

function ReportMetric({ icon: Icon, label, value, note }) {
  return (
    <div className="report-metric">
      <span><Icon size={19} /></span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
        <p>{note}</p>
      </div>
    </div>
  );
}

function ReportSection({ title, subtitle, children }) {
  return (
    <section className="admin-report-section">
      <div className="admin-report-section-heading">
        <div>
          <span>REPORT SECTION</span>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <BarChart3 size={20} />
      </div>
      {children}
    </section>
  );
}

function humanizeStatus(value = "") {
  const labels = {
    pending: "Pending Review",
    revision_required: "For Revision",
    approved: "Approved",
    rejected: "Rejected",
    published: "Published",
    draft: "Draft",
    archived: "Archived",
  };
  const normalized = String(value || "").toLowerCase();
  return labels[normalized] || humanizeAction(normalized) || "—";
}

function humanizeRole(value = "") {
  const normalized = String(value || "student").toLowerCase();
  if (normalized === "admin" || normalized === "administrator") return "Administrator";
  if (["personnel", "staff", "employee"].includes(normalized)) return "Personnel";
  if (["student", "applicant", "user"].includes(normalized)) return "Student";
  return humanizeAction(normalized) || "User";
}

function humanizeAction(value = "") {
  return String(value || "")
    .toLowerCase()
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
