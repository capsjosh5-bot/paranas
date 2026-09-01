import { APPLICATION_STATUSES } from "../../config/site";
export default function StatusBadge({ status }) {
    const config = APPLICATION_STATUSES[status] || { label: status || "Unknown", tone: "neutral" };
    return <span className={`status-badge status-${config.tone}`}>{config.label}</span>;
}

