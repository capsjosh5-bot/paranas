import { AlertTriangle, CheckCircle2, ClipboardList, GraduationCap, Plus, UsersRound } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import { getAllApplications } from "../../services/application.service";
import { getAdminScholarships } from "../../services/scholarship.service";
import { formatDateTime } from "../../utils/date";
export default function AdminDashboardPage() {
    const [applications, setApplications] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([getAllApplications(), getAdminScholarships()])
            .then(([apps, programs]) => { setApplications(apps); setScholarships(programs); })
            .finally(() => setLoading(false));
    }, []);
    const stats = useMemo(() => ({
        scholarships: scholarships.filter((item) => item.status === "published").length,
        applications: applications.length,
        pending: applications.filter((item) => item.status === "pending").length,
        approved: applications.filter((item) => item.status === "approved").length,
        revision: applications.filter((item) => item.status === "revision_required").length,
        rejected: applications.filter((item) => item.status === "rejected").length,
    }), [applications, scholarships]);
    const capacity = scholarships.filter((item) => item.status !== "archived").map((program) => {
        const used = applications.filter((app) => app.scholarshipId === program.id).length;
        const max = Number(program.maxApplicants || 1);
        return { ...program, used, percent: Math.min(100, Math.round((used / max) * 100)) };
    }).sort((a, b) => b.percent - a.percent).slice(0, 5);
    return (<>
      <PageHeader eyebrow="ADMINISTRATION" title="Scholarship Program Dashboard" description="Manage scholarship opportunities, monitor applicant volume, and review application decisions from one administrative workspace." actions={<Link className="button button-primary" to="/admin/scholarships/new"><Plus size={17}/> Create scholarship</Link>}/>
      <div className="stats-grid four">
        <StatCard icon={GraduationCap} label="Published Scholarships" value={stats.scholarships} note="Visible on public website"/>
        <StatCard icon={UsersRound} label="Total Applications" value={stats.applications} note="Across all scholarship cycles" tone="blue"/>
        <StatCard icon={ClipboardList} label="Pending Review" value={stats.pending} note="Awaiting administrator action" tone="gold"/>
        <StatCard icon={CheckCircle2} label="Approved" value={stats.approved} note="Successful applicants" tone="slate"/>
      </div>

      <div className="dashboard-grid two-one">
        <section className="panel-card">
          <div className="panel-heading"><div><span>RECENT SUBMISSIONS</span><h2>Applications requiring attention</h2></div><Link to="/admin/applicants">Open applicants</Link></div>
          {loading ? <div className="panel-loading">Loading applications…</div> : applications.length ? (<div className="admin-application-list">{applications.slice(0, 6).map((app) => <Link key={`${app.scholarshipId}-${app.applicantUid}`} className="admin-application-row" to={`/admin/review/${app.scholarshipId}/${app.applicantUid}`}><div className="admin-applicant-avatar">{initials(app.applicantName)}</div><div className="admin-applicant-copy"><strong>{app.applicantName}</strong><span>{app.scholarshipTitle}</span><small>Updated {formatDateTime(app.updatedAt)}</small></div><StatusBadge status={app.status}/></Link>)}</div>) : <div className="compact-empty"><p>No applications have been submitted yet.</p></div>}
        </section>
        <section className="panel-card">
          <div className="panel-heading"><div><span>WORK QUEUE</span><h2>Status overview</h2></div></div>
          <div className="status-overview">
            <StatusLine label="Pending review" value={stats.pending} total={stats.applications} tone="warning"/>
            <StatusLine label="For revision" value={stats.revision} total={stats.applications} tone="info"/>
            <StatusLine label="Approved" value={stats.approved} total={stats.applications} tone="success"/>
            <StatusLine label="Rejected" value={stats.rejected} total={stats.applications} tone="danger"/>
          </div>
          {stats.pending > 0 ? <Link className="button button-secondary button-block" to="/admin/reviews"><AlertTriangle size={17}/> Open review queue</Link> : null}
        </section>
      </div>

      <section className="panel-card capacity-panel">
        <div className="panel-heading"><div><span>PROGRAM CAPACITY</span><h2>Scholarship applicant limits</h2></div><Link to="/admin/scholarships">Manage scholarships</Link></div>
        {capacity.length ? <div className="capacity-list">{capacity.map((item) => <div className="capacity-row" key={item.id}><div><strong>{item.title}</strong><span>{item.used} of {item.maxApplicants} applicant slots used</span></div><div className="capacity-meter"><span style={{ width: `${item.percent}%` }}/></div><b>{item.percent}%</b></div>)}</div> : <div className="compact-empty"><p>Create a scholarship to begin monitoring capacity.</p></div>}
      </section>
    </>);
}
function initials(name = "") { return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AP"; }
function StatusLine({ label, value, total, tone }) { const pct = total ? Math.round((value / total) * 100) : 0; return <div className="status-line"><div><span>{label}</span><strong>{value}</strong></div><div className={`status-progress ${tone}`}><span style={{ width: `${pct}%` }}/></div><small>{pct}%</small></div>; }

