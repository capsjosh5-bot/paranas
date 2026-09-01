import { ClipboardCheck } from "lucide-react";
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
    return <><PageHeader eyebrow="REVIEW WORKFLOW" title="Pending Review Queue" description="Applications awaiting an administrator assessment and decision."/>
 {items.length ? <div className="review-card-grid">{items.map((app) => <article className="review-queue-card" key={`${app.scholarshipId}-${app.applicantUid}`}><div className="review-queue-icon"><ClipboardCheck size={20}/></div><div><span>{app.scholarshipTitle}</span><h2>{app.applicantName}</h2><p>{app.applicantEmail}</p><small>Submitted {formatDateTime(app.submittedAt)}</small></div><StatusBadge status={app.status}/><Link className="button button-primary button-block" to={`/admin/review/${app.scholarshipId}/${app.applicantUid}`}>Open application</Link></article>)}</div> : <EmptyState title="Review queue is clear" description="There are no pending applications waiting for administrator review."/>}</>;
}

