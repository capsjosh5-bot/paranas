import { BarChart3, ClipboardCheck, Clock3 } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import { getAllApplications } from "../../services/application.service";
import { formatDateTime } from "../../utils/date";

export default function ReviewQueuePage() {
  const [items, setItems] = useState([]);
  useEffect(() => { getAllApplications().then((apps) => setItems(apps.filter((app) => app.status === "pending"))); }, []);

  return (
    <div className="admin-page-pro">
      <PageHeader eyebrow="" title="Pending Review Queue" description="Applications waiting for assessment and an administrative decision." actions={<Link className="button button-secondary" to="/admin/reports?view=applications"><BarChart3 size={17}/> Report</Link>} />
      <div className="admin-review-summary"><div><span className="admin-review-summary-icon"><ClipboardCheck size={24}/></span><div><strong>{items.length}</strong><span>applications waiting</span></div></div><p>Open each application, review the submitted form and supporting information, then record the decision.</p></div>
      {items.length ? <div className="review-card-grid admin-review-grid-pro">{items.map((app) => <article className="review-queue-card admin-review-card-pro" key={`${app.scholarshipId}-${app.applicantUid}`}><div className="review-card-pro-top"><div className="admin-applicant-avatar">{initials(app.applicantName)}</div><StatusBadge status={app.status}/></div><div className="review-card-pro-copy"><span>{app.scholarshipTitle}</span><h2>{app.applicantName}</h2><p>{app.applicantEmail}</p><small><Clock3 size={14}/> Submitted {formatDateTime(app.submittedAt)}</small></div><Link className="button button-primary button-block" to={`/admin/review/${app.scholarshipId}/${app.applicantUid}`}>Review application</Link></article>)}</div> : <EmptyState title="Review queue is clear" description="There are no pending applications waiting for administrator review." />}
    </div>
  );
}
function initials(name = "") { return name.split(" ").filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "AP"; }
