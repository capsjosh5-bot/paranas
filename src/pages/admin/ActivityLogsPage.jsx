import { Activity, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import EmptyState from "../../components/common/EmptyState";
import PageHeader from "../../components/common/PageHeader";
import { getRecentAuditLogs } from "../../services/audit.service";
import { formatDateTime } from "../../utils/date";
export default function ActivityLogsPage() {
    const [logs, setLogs] = useState([]);
    const [query, setQuery] = useState("");
    useEffect(() => {
        getRecentAuditLogs(150).then(setLogs);
    }, []);
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        return logs.filter((item) => !q || `${item.actorName} ${item.action} ${item.entityType} ${item.detail}`.toLowerCase().includes(q));
    }, [logs, query]);
    return (<>
      <PageHeader eyebrow="SYSTEM ACCOUNTABILITY" title="Activity Logs" description="Administrative scholarship changes and application decisions recorded for internal accountability."/>
      <div className="workspace-toolbar">
        <label className="search-box">
          <Search size={18}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search action, administrator, or record"/>
        </label>
        <span>{filtered.length} recorded action{filtered.length === 1 ? "" : "s"}</span>
      </div>
      {filtered.length ? (<div className="activity-log-list">
          {filtered.map((log) => (<article className="activity-log-card" key={log.id}>
              <div className="activity-log-icon"><Activity size={18}/></div>
              <div className="activity-log-copy">
                <div><strong>{humanizeAction(log.action)}</strong><span>{formatDateTime(log.createdAt)}</span></div>
                <p>{log.detail || `${log.entityType} ${log.entityId}`}</p>
                <small>{log.actorName || "Administrator"} · {log.entityType} · {log.entityId}</small>
              </div>
            </article>))}
        </div>) : (<EmptyState title="No activity logs found" description="Administrative actions will appear here after scholarships are created, updated, archived, or reviewed."/>)}
    </>);
}
function humanizeAction(value = "") {
    return value.toLowerCase().split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
}

