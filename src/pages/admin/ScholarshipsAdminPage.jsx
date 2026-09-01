import { Archive, BarChart3, Edit3, Eye, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { getAllApplications } from "../../services/application.service";
import { archiveScholarship, getAdminScholarships } from "../../services/scholarship.service";
import { formatDate } from "../../utils/date";

export default function ScholarshipsAdminPage() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [archiveTarget, setArchiveTarget] = useState(null);

  async function load() {
    const [programs, apps] = await Promise.all([getAdminScholarships(), getAllApplications()]);
    setItems(programs);
    setApplications(apps);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => items.filter((item) =>
    (status === "all" || item.status === status) &&
    `${item.title} ${item.code} ${item.category}`.toLowerCase().includes(query.toLowerCase())
  ), [items, query, status]);

  const rows = useMemo(() => filtered.map((item) => {
    const used = applications.filter((app) => app.scholarshipId === item.id).length;
    const maximum = Math.max(0, Number(item.maxApplicants || 0));
    return { ...item, used, maximum, available: Math.max(0, maximum - used), utilization: maximum ? Math.min(100, Math.round((used / maximum) * 100)) : 0 };
  }), [filtered, applications]);

  const summary = useMemo(() => {
    const published = items.filter((item) => item.status === "published");
    const totalCapacity = published.reduce((sum, item) => sum + Math.max(0, Number(item.maxApplicants || 0)), 0);
    const used = published.reduce((sum, item) => sum + applications.filter((app) => app.scholarshipId === item.id).length, 0);
    return { total: items.length, published: published.length, capacity: totalCapacity, available: Math.max(0, totalCapacity - used) };
  }, [items, applications]);

  async function archive() {
    if (!archiveTarget) return;
    await archiveScholarship(archiveTarget.id, user.uid);
    setArchiveTarget(null);
    await load();
  }

  return (
    <div className="admin-page-pro">
      <PageHeader
        eyebrow="PROGRAM MANAGEMENT"
        title="Scholarships"
        description="Create and manage scholarship opportunities, application periods, capacity, and publishing status."
        actions={<div className="page-action-group"><Link className="button button-secondary" to="/admin/reports?view=scholarships"><BarChart3 size={17}/> Report</Link><Link className="button button-primary" to="/admin/scholarships/new"><Plus size={17}/> Create scholarship</Link></div>}
      />

      <div className="admin-mini-stats">
        <MiniStat label="Programs" value={summary.total} />
        <MiniStat label="Published" value={summary.published} />
        <MiniStat label="Published capacity" value={summary.capacity} />
        <MiniStat label="Available slots" value={summary.available} accent />
      </div>

      <div className="workspace-toolbar admin-toolbar-pro application-toolbar">
        <label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scholarship name, code, or category"/></label>
        <select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select>
      </div>

      {rows.length ? (
        <div className="table-card admin-table-card-pro">
          <div className="data-table scholarship-admin-table scholarship-admin-table-pro">
            <div className="table-row table-head"><span>Scholarship</span><span>Status</span><span>Applications</span><span>Available Slots</span><span>Deadline</span><span>Actions</span></div>
            {rows.map((item) => (
              <div className="table-row" key={item.id}>
                <span><strong>{item.title}</strong><small>{item.code || "No code"} · {item.category}</small></span>
                <span><span className={`program-status ${item.status}`}>{item.status}</span></span>
                <span className="program-usage-cell"><strong>{item.used} / {item.maximum}</strong><small>{item.utilization}% utilized</small></span>
                <span><strong className="available-number">{item.available}</strong><small>remaining</small></span>
                <span>{formatDate(item.closeDate)}</span>
                <span className="table-actions"><Link className="icon-button" title="Edit scholarship" to={`/admin/scholarships/${item.id}/edit`}><Edit3 size={17}/></Link>{item.status === "published" ? <Link className="icon-button" title="View public page" to={`/scholarships/${item.id}`} target="_blank"><Eye size={17}/></Link> : null}{item.status !== "archived" ? <button className="icon-button danger-text" title="Archive" onClick={() => setArchiveTarget(item)}><Archive size={17}/></button> : null}</span>
              </div>
            ))}
          </div>
        </div>
      ) : <EmptyState title="No scholarships found" description="Create a scholarship program or adjust the current filters." action={<Link className="button button-primary" to="/admin/scholarships/new">Create scholarship</Link>} />}

      <ConfirmDialog open={Boolean(archiveTarget)} title="Archive scholarship?" message="This removes the program from the public website while keeping existing application records available." confirmLabel="Archive scholarship" danger onConfirm={archive} onClose={() => setArchiveTarget(null)} />
    </div>
  );
}

function MiniStat({ label, value, accent = false }) {
  return <div className={accent ? "admin-mini-stat accent" : "admin-mini-stat"}><span>{label}</span><strong>{value}</strong></div>;
}
