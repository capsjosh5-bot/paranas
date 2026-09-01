import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { useAuth } from "../../hooks/useAuth";
import { getOwnApplications } from "../../services/application.service";
import { formatDateTime } from "../../utils/date";
export default function MyApplicationsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    useEffect(() => { getOwnApplications(user.uid).then(setItems); }, [user.uid]);
    const filtered = useMemo(() => items.filter((item) => (status === "all" || item.status === status) && `${item.scholarshipTitle} ${item.scholarshipCode}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);
    return <>
    <PageHeader eyebrow="MY RECORDS" title="My Applications" description="Track every scholarship application submitted through your account." actions={<Link className="button button-primary" to="/student/scholarships">Browse scholarships</Link>}/>
    <div className="workspace-toolbar application-toolbar"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applications"/></label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending Review</option><option value="revision_required">For Revision</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select></div>
    {filtered.length ? <div className="table-card"><div className="data-table desktop-table"><div className="table-row table-head"><span>Scholarship</span><span>Status</span><span>Submitted</span><span>Last updated</span><span></span></div>{filtered.map((app) => <div className="table-row" key={app.scholarshipId}><span><strong>{app.scholarshipTitle}</strong><small>{app.scholarshipCode || "LGU Program"}</small></span><span><StatusBadge status={app.status}/></span><span>{formatDateTime(app.submittedAt)}</span><span>{formatDateTime(app.updatedAt)}</span><span><Link className="table-action" to={`/student/applications/${app.scholarshipId}`}>View</Link></span></div>)}</div></div> : <EmptyState title="No applications found" description="Your submitted scholarship applications will appear here." action={<Link className="button button-primary" to="/student/scholarships">Browse scholarships</Link>}/>} 
  </>;
}

