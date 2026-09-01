import { ArrowRight, CalendarDays, GraduationCap, CircleDollarSign, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDate, isApplicationOpen } from "../../utils/date";
export default function ScholarshipCard({ scholarship, compact = false }) {
    const open = isApplicationOpen(scholarship);
    return (<article className={`scholarship-card ${compact ? "compact" : ""}`}>
      <div className="scholarship-card-top">
        <span className="program-pill"><GraduationCap size={15}/> {scholarship.category || "Scholarship"}</span>
        <span className={open ? "availability open" : "availability closed"}>{open ? "Open" : "Closed"}</span>
      </div>
      <h3>{scholarship.title}</h3>
      <p>{scholarship.description || "Scholarship support for qualified students of Paranas."}</p>
      <div className="scholarship-meta-grid">
        <span><CalendarDays size={16}/> Deadline <b>{formatDate(scholarship.closeDate)}</b></span>
        <span><Users size={16}/> Up to <b>{scholarship.maxApplicants || "—"}</b> applicants</span>
        {Number(scholarship.amount) > 0 ? <span><CircleDollarSign size={16}/> Grant <b>₱{Number(scholarship.amount).toLocaleString("en-PH")}</b></span> : null}
      </div>
      <Link className="card-link" to={`/scholarships/${scholarship.id}`}>View scholarship <ArrowRight size={17}/></Link>
    </article>);
}

