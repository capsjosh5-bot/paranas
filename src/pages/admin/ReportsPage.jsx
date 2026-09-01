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
  UserCog,
  UsersRound,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import { buildReportMetrics, buildScholarshipReportRows, getSystemReportData } from "../../services/report.service";
import { formatDate, formatDateTime } from "../../utils/date";

const reportViews = [
  ["full", "Full System Report"],
  ["applications", "Applications Report"],
  ["scholarships", "Scholarship Capacity Report"],
  ["users", "Registered Users Report"],
  ["activity", "Administrative Activity Report"],
];

export default function ReportsPage() {
  const { profile } = useAuth();
  const [searchParams] = useSearchParams();
  const requestedView = searchParams.get("view");
  const [view, setView] = useState(reportViews.some(([value]) => value === requestedView) ? requestedView : "full");
  const [data, setData] = useState({ users: [], scholarships: [], applications: [], auditLogs: [] });
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scholarshipId, setScholarshipId] = useState("all");
  const [generatedAt, setGeneratedAt] = useState(Date.now());

  async function load() {
    setLoading(true);
    try {
      setData(await getSystemReportData());
      setGeneratedAt(Date.now());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    document.body.classList.add("admin-report-context");
    load();
    return () => document.body.classList.remove("admin-report-context");
  }, []);

  const filteredApplications = useMemo(() => {
    const start = startDate ? new Date(`${startDate}T00:00:00`).getTime() : 0;
    const end = endDate ? new Date(`${endDate}T23:59:59`).getTime() : Number.MAX_SAFE_INTEGER;
    return data.applications.filter((item) => {
      const date = Number(item.submittedAt || item.updatedAt || 0);
      return date >= start && date <= end && (scholarshipId === "all" || item.scholarshipId === scholarshipId);
    });
  }, [data.applications, startDate, endDate, scholarshipId]);

  const filteredScholarships = useMemo(() => scholarshipId === "all" ? data.scholarships : data.scholarships.filter((item) => item.id === scholarshipId), [data.scholarships, scholarshipId]);
  const metrics = useMemo(() => buildReportMetrics({ users: data.users, scholarships: filteredScholarships, applications: filteredApplications }), [data.users, filteredScholarships, filteredApplications]);
  const scholarshipRows = useMemo(() => buildScholarshipReportRows(filteredScholarships, filteredApplications), [filteredScholarships, filteredApplications]);
  const reportTitle = reportViews.find(([value]) => value === view)?.[1] || "System Report";

  if (loading) return <Loader fullPage label="Preparing administration reports…" />;

  return (
    <div className="admin-report-page admin-page-pro">
      <PageHeader eyebrow="REPORTING" title="Reports" description="Generate a printable management report covering users, scholarships, applicant capacity, application decisions, and administrative activity." actions={<button className="button button-primary" onClick={() => window.print()}><Printer size={17}/> Print report</button>} />

      <section className="admin-report-toolbar admin-panel-pro">
        <div className="admin-report-toolbar-grid">
          <label className="field-label">Report type<select value={view} onChange={(e) => setView(e.target.value)}>{reportViews.map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
          <label className="field-label">Scholarship<select value={scholarshipId} onChange={(e) => setScholarshipId(e.target.value)}><option value="all">All scholarship programs</option>{data.scholarships.map((item) => <option value={item.id} key={item.id}>{item.title}</option>)}</select></label>
          <label className="field-label">From<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}/></label>
          <label className="field-label">To<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}/></label>
          <button type="button" className="button button-secondary admin-report-refresh" onClick={load}><RefreshCw size={16}/> Refresh</button>
        </div>
      </section>

      <section className="admin-report-paper">
        <header className="admin-report-header">
          <div className="admin-report-brand"><img src="/paranas-seal.png" alt="Municipality of Paranas seal"/><div><span>LGU SCHOLARSHIP PROGRAM</span><strong>Municipality of Paranas, Samar</strong><small>Scholarship Management System</small></div></div>
          <div className="admin-report-meta"><span>MANAGEMENT REPORT</span><h1>{reportTitle}</h1><p>Generated {formatDateTime(generatedAt)}</p><p>Prepared by {profile?.fullName || "Scholarship Administrator"}</p></div>
        </header>

        <div className="admin-report-filter-note"><CalendarDays size={16}/><span>Coverage: {startDate ? formatDate(startDate) : "All dates"} {endDate ? `to ${formatDate(endDate)}` : ""} · {scholarshipId === "all" ? "All scholarship programs" : filteredScholarships[0]?.title || "Selected program"}</span></div>

        {(view === "full" || view === "applications") && <ReportSummary metrics={metrics} />}

        {(view === "full" || view === "scholarships") && (
          <ReportSection title="Scholarship Capacity & Performance" subtitle="Applications received, maximum capacity, remaining slots, and decision totals per program.">
            <div className="report-table report-scholarship-table">
              <div className="report-row report-head"><span>Program</span><span>Status</span><span>Applications</span><span>Maximum</span><span>Available</span><span>Approved</span><span>Pending</span></div>
              {scholarshipRows.length ? scholarshipRows.map((row) => <div className="report-row" key={row.id}><span><strong>{row.title}</strong><small>{row.code || "LGU Program"}</small></span><span>{row.status}</span><span>{row.used}</span><span>{row.maximum}</span><span><strong>{row.available}</strong></span><span>{row.approved}</span><span>{row.pending + row.revision}</span></div>) : <div className="report-empty-row">No scholarship records for the selected report.</div>}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "applications") && (
          <ReportSection title="Application Register" subtitle={`${filteredApplications.length} application record${filteredApplications.length === 1 ? "" : "s"} in the selected coverage.`}>
            <div className="report-table report-application-table">
              <div className="report-row report-head"><span>Applicant</span><span>Scholarship</span><span>Status</span><span>Submitted</span><span>Updated</span></div>
              {filteredApplications.length ? filteredApplications.map((app) => <div className="report-row" key={`${app.scholarshipId}-${app.applicantUid}`}><span><strong>{app.applicantName || "Applicant"}</strong><small>{app.applicantEmail || ""}</small></span><span>{app.scholarshipTitle}</span><span>{humanizeStatus(app.status)}</span><span>{formatDateTime(app.submittedAt)}</span><span>{formatDateTime(app.updatedAt)}</span></div>) : <div className="report-empty-row">No application records for the selected coverage.</div>}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "users") && (
          <ReportSection title="Registered User Accounts" subtitle={`${data.users.length} registered account${data.users.length === 1 ? "" : "s"}: ${metrics.students} students and ${metrics.admins} administrators.`}>
            <div className="report-table report-user-table">
              <div className="report-row report-head"><span>Name</span><span>Email</span><span>Role</span><span>Barangay</span></div>
              {data.users.length ? data.users.map((item) => <div className="report-row" key={item.uid}><span><strong>{item.fullName || "Unnamed user"}</strong></span><span>{item.email || "—"}</span><span>{item.role === "admin" ? "Administrator" : "Student"}</span><span>{item.barangay || "—"}</span></div>) : <div className="report-empty-row">No user accounts found.</div>}
            </div>
          </ReportSection>
        )}

        {(view === "full" || view === "activity") && (
          <ReportSection title="Recent Administrative Activity" subtitle="Most recent system actions recorded for accountability.">
            <div className="report-table report-activity-table">
              <div className="report-row report-head"><span>Date</span><span>Administrator</span><span>Action</span><span>Details</span></div>
              {data.auditLogs.length ? data.auditLogs.slice(0, view === "activity" ? 200 : 25).map((item) => <div className="report-row" key={item.id}><span>{formatDateTime(item.createdAt)}</span><span>{item.actorName || "Administrator"}</span><span>{humanizeAction(item.action)}</span><span>{item.detail || `${item.entityType} ${item.entityId}`}</span></div>) : <div className="report-empty-row">No administrative activity has been recorded.</div>}
            </div>
          </ReportSection>
        )}

        <footer className="admin-report-footer"><span>LGU Scholarship Program · Municipality of Paranas, Samar</span><span>Generated from the Scholarship Management System</span></footer>
      </section>
    </div>
  );
}

function ReportSummary({ metrics }) {
  return <ReportSection title="System Summary" subtitle="Current scholarship program and application indicators."><div className="report-summary-grid">
    <ReportMetric icon={UsersRound} label="Registered Users" value={metrics.users} note={`${metrics.students} students · ${metrics.admins} admins`} />
    <ReportMetric icon={GraduationCap} label="Published Scholarships" value={metrics.published} note={`${metrics.scholarships} total programs`} />
    <ReportMetric icon={FileText} label="Applications" value={metrics.applications} note={`${metrics.notApproved} not yet approved / not approved`} />
    <ReportMetric icon={TicketCheck} label="Available Slots" value={metrics.availableSlots} note={`${metrics.usedCapacity} used of ${metrics.totalCapacity}`} />
    <ReportMetric icon={ClipboardCheck} label="Pending Review" value={metrics.pending} note={`${metrics.revision} for revision`} />
    <ReportMetric icon={CheckCircle2} label="Approved" value={metrics.approved} note={`${metrics.rejected} rejected`} />
  </div><div className="report-status-strip"><span><i className="status-mark pending"/>Pending <strong>{metrics.pending}</strong></span><span><i className="status-mark revision"/>For Revision <strong>{metrics.revision}</strong></span><span><i className="status-mark approved"/>Approved <strong>{metrics.approved}</strong></span><span><i className="status-mark rejected"/>Rejected <strong>{metrics.rejected}</strong></span></div></ReportSection>;
}

function ReportMetric({ icon: Icon, label, value, note }) { return <div className="report-metric"><span><Icon size={19}/></span><div><small>{label}</small><strong>{value}</strong><p>{note}</p></div></div>; }
function ReportSection({ title, subtitle, children }) { return <section className="admin-report-section"><div className="admin-report-section-heading"><div><span>REPORT SECTION</span><h2>{title}</h2><p>{subtitle}</p></div><BarChart3 size={20}/></div>{children}</section>; }
function humanizeStatus(value = "") { const labels = { pending: "Pending Review", revision_required: "For Revision", approved: "Approved", rejected: "Rejected" }; return labels[value] || value; }
function humanizeAction(value = "") { return String(value || "").toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "); }
