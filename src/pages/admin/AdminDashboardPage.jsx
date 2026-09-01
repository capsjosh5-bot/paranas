import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  GraduationCap,
  Plus,
  TicketCheck,
  UsersRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { getAllApplications } from "../../services/application.service";
import { getAdminUsers } from "../../services/report.service";
import { getAdminScholarships } from "../../services/scholarship.service";
import { formatDateTime } from "../../utils/date";

export default function AdminDashboardPage() {
  const { profile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [scholarships, setScholarships] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.all([getAllApplications(), getAdminScholarships(), getAdminUsers()])
      .then(([apps, programs, accounts]) => {
        if (!active) return;
        setApplications(Array.isArray(apps) ? apps : []);
        setScholarships(Array.isArray(programs) ? programs : []);
        setUsers(Array.isArray(accounts) ? accounts : []);
      })
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const dashboard = useMemo(() => {
    const published = scholarships.filter((item) => item.status === "published");
    const studentUsers = users.filter((item) => item.role === "student");
    const count = (status) => applications.filter((item) => item.status === status).length;

    const totalSlots = published.reduce((sum, item) => sum + Math.max(0, Number(item.maxApplicants || 0)), 0);
    const usedSlots = published.reduce((sum, item) => {
      return sum + applications.filter((app) => app.scholarshipId === item.id).length;
    }, 0);

    const rows = scholarships
      .filter((item) => item.status !== "archived")
      .map((program) => {
        const used = applications.filter((app) => app.scholarshipId === program.id).length;
        const maximum = Math.max(0, Number(program.maxApplicants || 0));
        return {
          ...program,
          used,
          maximum,
          available: Math.max(0, maximum - used),
          utilization: maximum ? Math.min(100, Math.round((used / maximum) * 100)) : 0,
        };
      })
      .sort((a, b) => b.utilization - a.utilization)
      .slice(0, 6);

    return {
      published: published.length,
      studentUsers: studentUsers.length,
      totalApplications: applications.length,
      availableSlots: Math.max(0, totalSlots - usedSlots),
      totalSlots,
      pending: count("pending"),
      revision: count("revision_required"),
      approved: count("approved"),
      rejected: count("rejected"),
      rows,
    };
  }, [applications, scholarships, users]);

  const firstName = (profile?.fullName || "Administrator").split(" ").filter(Boolean)[0] || "Administrator";

  return (
    <div className="admin-dashboard-pro">
      <section className="admin-page-intro admin-dashboard-intro">
        <div>
          <span className="admin-kicker">DASHBOARD</span>
          <h1>Welcome back, {firstName}.</h1>
          <p>Here is the current status of the Paranas LGU Scholarship Program.</p>
        </div>
        <div className="admin-page-actions">
          <Link className="button button-secondary" to="/admin/reports">
            <BarChart3 size={17} /> Generate report
          </Link>
          <Link className="button button-primary" to="/admin/scholarships/new">
            <Plus size={17} /> Create scholarship
          </Link>
        </div>
      </section>

      <section className="admin-stat-grid admin-stat-grid-six">
        <DashboardStat icon={GraduationCap} value={dashboard.published} label="Published Scholarships" link="/admin/scholarships" tone="green" />
        <DashboardStat icon={UsersRound} value={dashboard.studentUsers} label="Registered Students" link="/admin/reports?view=users" tone="blue" />
        <DashboardStat icon={FileText} value={dashboard.totalApplications} label="Total Applications" link="/admin/applicants" tone="violet" />
        <DashboardStat icon={TicketCheck} value={dashboard.availableSlots} label="Available Slots" link="/admin/scholarships" tone="gold" />
        <DashboardStat icon={ClipboardCheck} value={dashboard.pending} label="Pending Review" link="/admin/reviews" tone="amber" />
        <DashboardStat icon={CheckCircle2} value={dashboard.approved} label="Approved" link="/admin/applicants?status=approved" tone="success" />
      </section>

      <section className="admin-panel-pro admin-capacity-overview">
        <div className="admin-panel-heading-pro">
          <div>
            <span>SCHOLARSHIP CAPACITY OVERVIEW</span>
            <h2>Program slots and utilization</h2>
          </div>
          <Link to="/admin/scholarships">View all scholarships <ArrowRight size={15} /></Link>
        </div>

        {loading ? (
          <div className="admin-loading-row">Loading scholarship capacity…</div>
        ) : dashboard.rows.length ? (
          <div className="admin-capacity-table">
            <div className="admin-capacity-head">
              <span>Program</span><span>Applications</span><span>Maximum</span><span>Available</span><span>Utilization</span>
            </div>
            {dashboard.rows.map((row) => (
              <Link className="admin-capacity-row" to={`/admin/scholarships/${row.id}/edit`} key={row.id}>
                <span className="admin-capacity-program"><strong>{row.title}</strong><small>{row.code || "LGU Scholarship"}</small></span>
                <span><strong>{row.used}</strong><div className="mini-progress"><i style={{ width: `${row.utilization}%` }} /></div></span>
                <span>{row.maximum}</span>
                <span className="available-number">{row.available}</span>
                <span className="utilization-cell"><strong>{row.utilization}%</strong><i className="utilization-dot" style={{ "--percent": `${row.utilization * 3.6}deg` }} /></span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="admin-empty-pro">No scholarship programs have been created yet.</div>
        )}
      </section>

      <div className="admin-dashboard-lower-grid">
        <section className="admin-panel-pro">
          <div className="admin-panel-heading-pro">
            <div><span>RECENT APPLICATIONS</span><h2>Latest student submissions</h2></div>
            <Link to="/admin/applicants">View all <ArrowRight size={15} /></Link>
          </div>
          {applications.length ? (
            <div className="admin-recent-list">
              {applications.slice(0, 6).map((app) => (
                <Link className="admin-recent-row" key={`${app.scholarshipId}-${app.applicantUid}`} to={`/admin/review/${app.scholarshipId}/${app.applicantUid}`}>
                  <div className="admin-applicant-avatar">{initials(app.applicantName)}</div>
                  <div className="admin-recent-copy"><strong>{app.applicantName || "Unnamed applicant"}</strong><span>{app.scholarshipTitle || "Scholarship application"}</span></div>
                  <StatusBadge status={app.status} />
                  <time>{formatDateTime(app.updatedAt || app.submittedAt)}</time>
                  <ArrowRight size={15} />
                </Link>
              ))}
            </div>
          ) : <div className="admin-empty-pro">No applications have been submitted yet.</div>}
        </section>

        <div className="admin-dashboard-side-stack">
          <section className="admin-panel-pro">
            <div className="admin-panel-heading-pro"><div><span>WORK QUEUE</span><h2>Application status</h2></div></div>
            <div className="admin-status-list">
              <QueueItem label="Pending Review" value={dashboard.pending} tone="amber" to="/admin/reviews" />
              <QueueItem label="For Revision" value={dashboard.revision} tone="blue" to="/admin/applicants?status=revision_required" />
              <QueueItem label="Approved" value={dashboard.approved} tone="green" to="/admin/applicants?status=approved" />
              <QueueItem label="Rejected" value={dashboard.rejected} tone="red" to="/admin/applicants?status=rejected" />
            </div>
          </section>

          <section className="admin-panel-pro admin-quick-actions">
            <div className="admin-panel-heading-pro"><div><span>QUICK ACTIONS</span><h2>Common tasks</h2></div></div>
            <div className="admin-quick-grid">
              <QuickAction icon={Plus} label="Create Scholarship" to="/admin/scholarships/new" />
              <QuickAction icon={ClipboardCheck} label="Review Queue" to="/admin/reviews" />
              <QuickAction icon={BarChart3} label="Generate Report" to="/admin/reports" />
              <QuickAction icon={GraduationCap} label="Manage Programs" to="/admin/scholarships" />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardStat({ icon: Icon, value, label, link, tone }) {
  return (
    <Link className={`admin-stat-card-pro tone-${tone}`} to={link}>
      <span className="admin-stat-icon-pro"><Icon size={22} /></span>
      <strong>{value}</strong>
      <span>{label}</span>
      <small>View details <ArrowRight size={12} /></small>
    </Link>
  );
}

function QueueItem({ label, value, tone, to }) {
  return <Link className="admin-queue-item" to={to}><i className={`queue-dot ${tone}`} /><span>{label}</span><strong>{value}</strong><ArrowRight size={15} /></Link>;
}

function QuickAction({ icon: Icon, label, to }) {
  return <Link className="admin-quick-action" to={to}><span><Icon size={19} /></span><strong>{label}</strong></Link>;
}

function initials(name = "") {
  return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AP";
}
