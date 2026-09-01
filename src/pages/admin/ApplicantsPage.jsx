import { BarChart3, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { getAllApplications } from "../../services/application.service";
import { getAdminScholarships } from "../../services/scholarship.service";
import { formatDateTime } from "../../utils/date";

export default function ApplicantsPage() {
  const [searchParams] = useSearchParams();
  const [items, setItems] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "all");
  const [program, setProgram] = useState("all");

  useEffect(() => {
    Promise.all([getAllApplications(), getAdminScholarships()]).then(([apps, scholarships]) => {
      setItems(apps);
      setPrograms(scholarships);
    });
  }, []);

  const filtered = useMemo(() => items.filter((app) =>
    (status === "all" || app.status === status) &&
    (program === "all" || app.scholarshipId === program) &&
    `${app.applicantName} ${app.applicantEmail} ${app.scholarshipTitle}`.toLowerCase().includes(query.toLowerCase())
  ), [items, query, status, program]);

  const counts = useMemo(() => ({
    total: items.length,
    pending: items.filter((item) => item.status === "pending").length,
    approved: items.filter((item) => item.status === "approved").length,
    rejected: items.filter((item) => item.status === "rejected").length,
  }), [items]);

  return (
    <div className="admin-page-pro">
      <PageHeader eyebrow="APPLICATION MANAGEMENT" title="Applicants" description="Search, filter, and review all scholarship applications in one organized workspace." actions={<Link className="button button-secondary" to="/admin/reports?view=applications"><BarChart3 size={17}/> Generate report</Link>} />

      <div className="admin-mini-stats">
        <MiniStat label="All applicants" value={counts.total} />
        <MiniStat label="Pending review" value={counts.pending} />
        <MiniStat label="Approved" value={counts.approved} accent />
        <MiniStat label="Rejected" value={counts.rejected} />
      </div>

      <div className="workspace-toolbar admin-toolbar-pro filters-three">
        <label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search applicant, email, or scholarship"/></label>
        <select value={program} onChange={(e) => setProgram(e.target.value)}><option value="all">All scholarships</option>{programs.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}</select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="pending">Pending Review</option><option value="revision_required">For Revision</option><option value="approved">Approved</option><option value="rejected">Rejected</option></select>
      </div>

      {filtered.length ? (
        <div className="table-card admin-table-card-pro">
          <div className="data-table applicant-admin-table applicant-admin-table-pro">
            <div className="table-row table-head"><span>Applicant</span><span>Scholarship</span><span>Status</span><span>Submitted</span><span></span></div>
            {filtered.map((app) => <div className="table-row" key={`${app.scholarshipId}-${app.applicantUid}`}><span className="applicant-cell"><div className="admin-applicant-avatar small">{initials(app.applicantName)}</div><div><strong>{app.applicantName}</strong><small>{app.applicantEmail}</small></div></span><span><strong>{app.scholarshipTitle}</strong><small>{app.scholarshipCode || "LGU Program"}</small></span><span><StatusBadge status={app.status}/></span><span>{formatDateTime(app.submittedAt)}</span><span><Link className="table-action" to={`/admin/review/${app.scholarshipId}/${app.applicantUid}`}>Open</Link></span></div>)}
          </div>
        </div>
      ) : <EmptyState title="No applicants found" description="No applications match the current search and filters." />}
    </div>
  );
}
function initials(name = "") { return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AP"; }
function MiniStat({ label, value, accent = false }) { return <div className={accent ? "admin-mini-stat accent" : "admin-mini-stat"}><span>{label}</span><strong>{value}</strong></div>; }
