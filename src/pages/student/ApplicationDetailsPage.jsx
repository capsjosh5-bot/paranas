import { ArrowLeft, Clock3, FilePenLine, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import OfficialApplicationPrint from "../../components/print/OfficialApplicationPrint";
import { useAuth } from "../../hooks/useAuth";
import { subscribeOwnApplication } from "../../services/application.service";
import { formatDateTime } from "../../utils/date";

export default function ApplicationDetailsPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeOwnApplication(id, user.uid, (value) => {
      setApp(value);
      setLoading(false);
    });
    return unsubscribe;
  }, [id, user.uid]);

  if (loading) return <Loader fullPage label="Loading application…" />;
  if (!app) return <div className="panel-card"><h2>Application not found</h2></div>;

  const s = app.formData?.student || {};
  const p = app.formData?.parents || {};
  const policy = app.formData?.policyAgreement || {};

  return (
    <>
      <PageHeader
        eyebrow="APPLICATION RECORD"
        title={app.scholarshipTitle}
        description={`Submitted ${formatDateTime(app.submittedAt)}`}
        actions={
          <div className="page-action-group">
            <button className="button button-secondary" onClick={() => window.print()}>
              <Printer size={17} /> Print Application & Policy
            </button>
            {app.status === "revision_required" ? (
              <Link className="button button-primary" to={`/student/apply/${id}`}>
                <FilePenLine size={17} /> Revise application
              </Link>
            ) : null}
          </div>
        }
      />

      <Link to="/student/applications" className="back-link"><ArrowLeft size={17} /> My applications</Link>

      <div className="application-detail-layout">
        <div className="application-detail-main">
          <section className="panel-card record-status-card">
            <div><span>CURRENT STATUS</span><StatusBadge status={app.status} /></div>
            <div><span>LAST UPDATED</span><strong>{formatDateTime(app.updatedAt)}</strong></div>
          </section>

          {app.adminReview?.remarks ? (
            <section className={app.status === "revision_required" ? "panel-card admin-message revision" : "panel-card admin-message"}>
              <span>ADMINISTRATOR REMARKS</span>
              <h2>{app.status === "revision_required" ? "Revision instructions" : "Application review note"}</h2>
              <p>{app.adminReview.remarks}</p>
              {app.adminReview.assessment ? (
                <div className="assessment-note"><strong>Assessment / Evaluation</strong><p>{app.adminReview.assessment}</p></div>
              ) : null}
            </section>
          ) : null}

          <RecordSection title="Student Information">
            <RecordGrid entries={{
              "Full name": s.fullName,
              Birthday: s.birthday,
              Age: s.age,
              Sex: s.sex,
              Address: s.address,
              Cellphone: s.phone,
              "School graduated": s.schoolGraduated,
              "School year": s.schoolYear,
              "General average": s.generalAverage,
              Honors: s.honors,
              Course: s.course,
              "College / University": s.schoolNamePlace,
              "Facebook Account": s.messenger,
              "4Ps Member": s.fourPs,
            }} />
          </RecordSection>

          <RecordSection title="Parent / Guardian Information">
            <RecordGrid entries={{
              Father: p.fatherName,
              "Father age": p.fatherAge,
              "Father occupation": p.fatherOccupation,
              Mother: p.motherName,
              "Mother age": p.motherAge,
              "Mother occupation": p.motherOccupation,
              "Number of children": p.numberOfChildren,
              "Gross monthly income": p.grossMonthlyIncome ? `₱${Number(p.grossMonthlyIncome).toLocaleString("en-PH")}` : "",
              Guardian: p.guardianName,
              Relationship: p.guardianRelationship,
            }} />
          </RecordSection>

          {Object.keys(app.formData?.customAnswers || {}).length ? (
            <RecordSection title="Additional Answers"><RecordGrid entries={app.formData.customAnswers} /></RecordSection>
          ) : null}

          <RecordSection title="LGU Scholars Policy Agreement">
            <RecordGrid entries={{
              "Parent / Guardian Name": policy.parentGuardianName,
              "Student Name": policy.studentName || s.fullName,
              Barangay: policy.barangay,
              "Agreement Status": policy.accepted ? "Accepted" : "Not Accepted",
            }} />
          </RecordSection>
        </div>

        <aside className="application-detail-side">
          {app.photoDataUrl ? <div className="panel-card identity-card"><span>2×2 APPLICANT PHOTO</span><img src={app.photoDataUrl} alt="Applicant" /></div> : null}
          {app.signatureDataUrl ? <div className="panel-card signature-record"><span>STUDENT ELECTRONIC SIGNATURE</span><img src={app.signatureDataUrl} alt="Student electronic signature" /><small>Signed {formatDateTime(app.signatureAudit?.signedAt)}</small></div> : null}
          {policy.parentSignatureDataUrl ? <div className="panel-card signature-record"><span>PARENT / GUARDIAN SIGNATURE</span><img src={policy.parentSignatureDataUrl} alt="Parent or guardian electronic signature" /><small>Submitted with the LGU Scholars Policy Agreement.</small></div> : null}
          {app.status === "approved" ? (
            <div className="panel-card official-approval-status-card">
              <span>OFFICIAL APPROVAL</span>
              <strong>Approved by the Municipal Government</strong>
              <p>The print package includes your official application, review/approval details, and the LGU Scholars policy page.</p>
            </div>
          ) : null}
          <div className="panel-card timeline-card"><span>STATUS HISTORY</span>{Object.values(app.statusHistory || {}).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((item) => <div className="timeline-item" key={item.timestamp}><Clock3 size={16} /><div><strong>{item.label}</strong><small>{formatDateTime(item.timestamp)}</small></div></div>)}</div>
        </aside>
      </div>

      <OfficialApplicationPrint application={app} />
    </>
  );
}

function RecordSection({ title, children }) {
  return <section className="panel-card record-section"><h2>{title}</h2>{children}</section>;
}

function RecordGrid({ entries }) {
  return <div className="record-grid">{Object.entries(entries).map(([label, value]) => <div key={label}><span>{label}</span><strong>{Array.isArray(value) ? value.join(", ") : value || "—"}</strong></div>)}</div>;
}
