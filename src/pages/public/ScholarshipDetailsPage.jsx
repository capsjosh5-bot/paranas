import { ArrowLeft, CalendarDays, CheckCircle2, Clock3, FileText, CircleDollarSign, UsersRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import { getPublicScholarship } from "../../services/scholarship.service";
import { formatDate, isApplicationOpen } from "../../utils/date";
export default function ScholarshipDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [scholarship, setScholarship] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => { getPublicScholarship(id).then(setScholarship).finally(() => setLoading(false)); }, [id]);
    if (loading)
        return <Loader fullPage label="Loading scholarship…"/>;
    if (!scholarship)
        return <section className="public-section"><div className="notice-card"><h1>Scholarship not found</h1><p>This scholarship may no longer be published.</p><Link to="/scholarships" className="button button-primary">Back to scholarships</Link></div></section>;
    const open = isApplicationOpen(scholarship);
    const applyPath = `/student/apply/${scholarship.id}`;
    function apply() {
        if (!user)
            navigate("/login", { state: { from: applyPath } });
        else if (profile?.role === "admin")
            navigate("/admin/scholarships");
        else
            navigate(applyPath);
    }
    return (<section className="public-section details-page">
      <Link to="/scholarships" className="back-link"><ArrowLeft size={17}/> Back to scholarships</Link>
      <div className="details-grid">
        <article className="details-main">
          <div className="details-title-row"><div><span className="program-pill">{scholarship.category}</span><h1>{scholarship.title}</h1><p>{scholarship.description}</p></div><span className={open ? "availability open large" : "availability closed large"}>{open ? "Applications Open" : "Applications Closed"}</span></div>
          <div className="detail-metric-grid">
            <Metric icon={CalendarDays} label="Application deadline" value={formatDate(scholarship.closeDate)}/>
            <Metric icon={UsersRound} label="Applicant capacity" value={`${scholarship.maxApplicants} applicants`}/>
            <Metric icon={CircleDollarSign} label="Scholarship grant" value={Number(scholarship.amount) ? `₱${Number(scholarship.amount).toLocaleString("en-PH")}` : "See program details"}/>
            <Metric icon={Clock3} label="Academic period" value={[scholarship.semester, scholarship.academicYear].filter(Boolean).join(" · ") || "Current cycle"}/>
          </div>
          <section className="detail-block"><h2>Program benefits</h2><p className="preline">{scholarship.benefits || "Scholarship benefits are defined by the published LGU program notice."}</p></section>
          <section className="detail-block"><h2>Eligibility</h2><p className="preline">{scholarship.eligibility || "Applicants must satisfy the eligibility criteria established for this scholarship program."}</p></section>
          <section className="detail-block"><h2>Application requirements</h2>{scholarship.requirements?.length ? <ul className="requirement-list">{scholarship.requirements.map((item) => <li key={item}><CheckCircle2 size={18}/> {item}</li>)}</ul> : <p>Complete the online application form and provide all requested information.</p>}</section>
          {scholarship.customQuestions?.length ? <section className="detail-block"><h2>Additional application questions</h2><p>This scholarship includes {scholarship.customQuestions.length} program-specific question{scholarship.customQuestions.length === 1 ? "" : "s"} in addition to the standard LGU application form.</p></section> : null}
        </article>
        <aside className="apply-panel">
          <div className="apply-panel-icon"><FileText size={24}/></div><h2>Ready to apply?</h2><p>You must be signed in to complete and submit the official application form.</p>
          <button className="button button-primary button-block" onClick={apply} disabled={!open}>{open ? "Start application" : "Application closed"}</button>
          {!user ? <small>Already registered? <Link to="/login">Sign in here</Link>.</small> : null}
          <div className="apply-security-note"><CheckCircle2 size={17}/><span>Your application is linked to your authenticated Firebase account.</span></div>
        </aside>
      </div>
    </section>);
}
function Metric({ icon: Icon, label, value }) { return <div className="detail-metric"><Icon size={19}/><div><span>{label}</span><strong>{value}</strong></div></div>; }

