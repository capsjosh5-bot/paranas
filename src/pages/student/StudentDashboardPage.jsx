import { AlertCircle, Bell, CheckCircle2, ClipboardList, GraduationCap } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import StatCard from "../../components/common/StatCard";
import StatusBadge from "../../components/common/StatusBadge";
import ScholarshipCard from "../../components/scholarships/ScholarshipCard";
import { useAuth } from "../../hooks/useAuth";
import { getOwnApplications } from "../../services/application.service";
import { getNotifications } from "../../services/notification.service";
import { getPublicScholarships } from "../../services/scholarship.service";
import { formatDateTime, isApplicationOpen } from "../../utils/date";
export default function StudentDashboardPage() {
    const { user, profile } = useAuth();
    const [applications, setApplications] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [scholarships, setScholarships] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        Promise.all([getOwnApplications(user.uid), getNotifications(user.uid), getPublicScholarships()])
            .then(([apps, notes, programs]) => { setApplications(apps); setNotifications(notes); setScholarships(programs); })
            .finally(() => setLoading(false));
    }, [user.uid]);
    const summary = useMemo(() => ({
        total: applications.length,
        pending: applications.filter((item) => item.status === "pending").length,
        revision: applications.filter((item) => item.status === "revision_required").length,
        approved: applications.filter((item) => item.status === "approved").length,
    }), [applications]);
    const unread = notifications.filter((item) => !item.read).length;
    const available = scholarships.filter(isApplicationOpen).filter((item) => !applications.some((app) => app.scholarshipId === item.id)).slice(0, 2);
    return (<>
      <div className="welcome-banner">
        <div><span>STUDENT DASHBOARD</span><h1>Welcome, {profile?.fullName?.split(" ")[0] || "Student"}</h1><p>Review your applications, respond to revision requests, and discover currently open scholarship opportunities.</p></div>
        <div className="welcome-badge"><GraduationCap size={28}/><span>LGU Scholarship Applicant</span></div>
      </div>
      <div className="stats-grid four">
        <StatCard icon={ClipboardList} label="Applications" value={summary.total} note="All submitted applications"/>
        <StatCard icon={AlertCircle} label="For Revision" value={summary.revision} note="Requires your attention" tone="gold"/>
        <StatCard icon={CheckCircle2} label="Approved" value={summary.approved} note="Successful applications" tone="blue"/>
        <StatCard icon={Bell} label="Unread Notices" value={unread} note="Application updates" tone="slate"/>
      </div>
      <div className="dashboard-grid two-one">
        <section className="panel-card">
          <div className="panel-heading"><div><span>RECENT ACTIVITY</span><h2>My applications</h2></div><Link to="/student/applications">View all</Link></div>
          {loading ? <div className="panel-loading">Loading applications…</div> : applications.length ? (<div className="application-list">{applications.slice(0, 4).map((app) => <Link className="application-row" key={app.scholarshipId} to={`/student/applications/${app.scholarshipId}`}><div><strong>{app.scholarshipTitle}</strong><span>Updated {formatDateTime(app.updatedAt)}</span></div><StatusBadge status={app.status}/></Link>)}</div>) : <div className="compact-empty"><h3>No submitted applications yet</h3><p>Browse open scholarships and start your first application.</p><Link className="button button-primary button-sm" to="/student/scholarships">Browse scholarships</Link></div>}
        </section>
        <section className="panel-card">
          <div className="panel-heading"><div><span>NOTIFICATIONS</span><h2>Latest updates</h2></div><Link to="/student/notifications">View all</Link></div>
          {notifications.length ? <div className="notice-list">{notifications.slice(0, 4).map((note) => <div className={note.read ? "notice-row" : "notice-row unread"} key={note.id}><span className="notice-dot"/><div><strong>{note.title}</strong><p>{note.message}</p><small>{formatDateTime(note.createdAt)}</small></div></div>)}</div> : <div className="compact-empty"><p>No notifications yet.</p></div>}
        </section>
      </div>
      <section className="panel-card dashboard-opportunities">
        <div className="panel-heading"><div><span>OPEN OPPORTUNITIES</span><h2>Scholarships you can explore</h2></div><Link to="/student/scholarships">Browse all</Link></div>
        {available.length ? <div className="student-scholarship-grid">{available.map((item) => <ScholarshipCard key={item.id} scholarship={item} compact/>)}</div> : <div className="compact-empty"><p>No additional open scholarships are available right now.</p></div>}
      </section>
    </>);
}

