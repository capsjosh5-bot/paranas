import { Archive, Edit3, Eye, Plus, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ConfirmDialog from "../../components/common/ConfirmDialog";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { archiveScholarship, getAdminScholarships } from "../../services/scholarship.service";
import { formatDate } from "../../utils/date";
export default function ScholarshipsAdminPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    const [query, setQuery] = useState("");
    const [status, setStatus] = useState("all");
    const [archiveTarget, setArchiveTarget] = useState(null);
    async function load() { setItems(await getAdminScholarships()); }
    useEffect(() => { load(); }, []);
    const filtered = useMemo(() => items.filter((item) => (status === "all" || item.status === status) && `${item.title} ${item.code} ${item.category}`.toLowerCase().includes(query.toLowerCase())), [items, query, status]);
    async function archive() {
        if (!archiveTarget)
            return;
        await archiveScholarship(archiveTarget.id, user.uid);
        setArchiveTarget(null);
        await load();
    }
    return <><PageHeader eyebrow="PROGRAM MANAGEMENT" title="Scholarships" description="Create, publish, edit, and archive scholarship opportunities. Published scholarships appear on the public website." actions={<Link className="button button-primary" to="/admin/scholarships/new"><Plus size={17}/> Create scholarship</Link>}/>
 <div className="workspace-toolbar application-toolbar"><label className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search scholarship name or code"/></label><select value={status} onChange={(e) => setStatus(e.target.value)}><option value="all">All statuses</option><option value="published">Published</option><option value="draft">Draft</option><option value="archived">Archived</option></select></div>
 {filtered.length ? <div className="table-card"><div className="data-table scholarship-admin-table"><div className="table-row table-head"><span>Scholarship</span><span>Status</span><span>Capacity</span><span>Deadline</span><span>Actions</span></div>{filtered.map((item) => <div className="table-row" key={item.id}><span><strong>{item.title}</strong><small>{item.code || "No code"} · {item.category}</small></span><span><span className={`program-status ${item.status}`}>{item.status}</span></span><span>{item.maxApplicants} applicants</span><span>{formatDate(item.closeDate)}</span><span className="table-actions"><Link className="icon-button" title="Edit scholarship" to={`/admin/scholarships/${item.id}/edit`}><Edit3 size={17}/></Link>{item.status === "published" ? <Link className="icon-button" title="View public page" to={`/scholarships/${item.id}`} target="_blank"><Eye size={17}/></Link> : null}{item.status !== "archived" ? <button className="icon-button danger-text" title="Archive" onClick={() => setArchiveTarget(item)}><Archive size={17}/></button> : null}</span></div>)}</div></div> : <EmptyState title="No scholarships found" description="Create your first scholarship program or adjust the current filter." action={<Link className="button button-primary" to="/admin/scholarships/new">Create scholarship</Link>}/>} 
 <ConfirmDialog open={Boolean(archiveTarget)} title="Archive scholarship?" message="This will remove the scholarship from the public website. Existing application records will remain available to administrators and students." confirmLabel="Archive scholarship" danger onConfirm={archive} onClose={() => setArchiveTarget(null)}/></>;
}

