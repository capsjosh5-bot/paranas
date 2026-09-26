import { ArrowLeft, CheckCircle2, Clock3, ImagePlus, Printer, Save, Trash2, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import StatusBadge from "../../components/common/StatusBadge";
import OfficialApplicationPrint from "../../components/print/OfficialApplicationPrint";
import { useAuth } from "../../hooks/useAuth";
import { getApplicationForAdmin, reviewApplication } from "../../services/application.service";
import { compressImage } from "../../utils/image";
import { formatDateTime } from "../../utils/date";
import { humanizeFirebaseError } from "../../utils/validation";

const DEFAULT_MAYOR = "HON. ELVIRA U. BABALCON";
const DEFAULT_MAYOR_TITLE = "Municipal Mayor";

export default function ApplicationReviewPage() {
  const { scholarshipId, uid } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    status: "pending",
    assessment: "",
    remarks: "",
    approvalSignatureDataUrl: "",
    approvalSignatoryName: DEFAULT_MAYOR,
    approvalSignatoryTitle: DEFAULT_MAYOR_TITLE,
    approvalSignatureAuthorized: false,
  });
  const [saving, setSaving] = useState(false);
  const [signatureLoading, setSignatureLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  function hydrate(data) {
    setApp(data);
    if (!data) return;
    setForm({
      status: data.status || "pending",
      assessment: data.adminReview?.assessment || "",
      remarks: data.adminReview?.remarks || "",
      approvalSignatureDataUrl: data.adminReview?.approvalSignatureDataUrl || "",
      approvalSignatoryName: data.adminReview?.approvalSignatoryName || DEFAULT_MAYOR,
      approvalSignatoryTitle: data.adminReview?.approvalSignatoryTitle || DEFAULT_MAYOR_TITLE,
      approvalSignatureAuthorized: Boolean(data.adminReview?.approvalSignatureAuthorized || data.adminReview?.approvalSignatureDataUrl),
    });
  }

  useEffect(() => {
    getApplicationForAdmin(scholarshipId, uid)
      .then(hydrate)
      .finally(() => setLoading(false));
  }, [scholarshipId, uid]);

  async function handleApprovalSignature(file) {
    if (!file) return;
    setSignatureLoading(true);
    setError("");
    try {
      const dataUrl = await compressImage(file, { maxWidth: 720, maxHeight: 260, quality: 0.82 });
      if (dataUrl.length > 260_000) throw new Error("The signature image is still too large. Please use a smaller PNG/JPG image.");
      setForm((current) => ({ ...current, approvalSignatureDataUrl: dataUrl, approvalSignatureAuthorized: false }));
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSignatureLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      if (form.status === "approved") {
        if (!form.approvalSignatureDataUrl) {
          throw new Error("Upload the authorized Municipal Mayor approval signature before approving this application.");
        }
        if (!form.approvalSignatureAuthorized) {
          throw new Error("Confirm that the uploaded approval signature is authorized for official use.");
        }
      }

      await reviewApplication({
        scholarshipId,
        applicantUid: uid,
        status: form.status,
        assessment: form.assessment,
        remarks: form.remarks,
        adminUid: user.uid,
        adminName: profile?.fullName || "Administrator",
        approvalSignatureDataUrl: form.approvalSignatureDataUrl,
        approvalSignatoryName: form.approvalSignatoryName,
        approvalSignatoryTitle: form.approvalSignatoryTitle,
        approvalSignatureAuthorized: form.approvalSignatureAuthorized,
      });

      setMessage("Application decision saved, official approval data recorded, and the student was notified.");

      // Return admin to the Pending Review Queue after successful notification
      setTimeout(() => {
        navigate("/admin/reviews");
      }, 1000);
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader fullPage label="Loading application for review…" />;
  if (!app) return <div className="panel-card"><h2>Application not found</h2></div>;

  const s = app.formData?.student || {};
  const p = app.formData?.parents || {};
  const policy = app.formData?.policyAgreement || {};

  return (
    <>
      <PageHeader
        eyebrow="APPLICATION REVIEW"
        title={app.applicantName}
        description={`${app.scholarshipTitle} · Submitted ${formatDateTime(app.submittedAt)}`}
        actions={
          <div className="page-action-group">
            <button className="button button-secondary" onClick={() => window.print()}><Printer size={17} /> Print Application & Policy</button>
            <Link className="button button-secondary" to="/admin/applicants"><ArrowLeft size={17} /> Applicants</Link>
          </div>
        }
      />

      {message ? <div className="form-alert success">{message}</div> : null}
      {error ? <div className="form-alert error">{error}</div> : null}

      <div className="review-layout">
        <div className="review-document">
          <section className="panel-card review-header-card">
            <div className="review-applicant-head"><div className="review-avatar"><UserRound size={28} /></div><div><span>APPLICANT</span><h2>{app.applicantName}</h2><p>{app.applicantEmail}</p></div></div>
            <StatusBadge status={app.status} />
          </section>

          <ReviewSection title="A. Student Information">
            <RecordGrid entries={{
              "Complete Name": s.fullName,
              Birthday: s.birthday,
              Age: s.age,
              Sex: s.sex,
              "Complete Address": s.address,
              "Cellphone Number": s.phone,
              "School Graduated": s.schoolGraduated,
              "School Year": s.schoolYear,
              "General Average": s.generalAverage,
              "Honors Received": s.honors,
              "Course to Be Taken": s.course,
              "College / University Name": s.schoolNamePlace,
              "Facebook Account": s.messenger,
              "4Ps Member": s.fourPs,
            }} />
          </ReviewSection>

          <ReviewSection title="B. Parent / Guardian Information">
            <RecordGrid entries={{
              Father: p.fatherName,
              "Father's Age": p.fatherAge,
              "Father's Occupation": p.fatherOccupation,
              Mother: p.motherName,
              "Mother's Age": p.motherAge,
              "Mother's Occupation": p.motherOccupation,
              "Number of Children": p.numberOfChildren,
              "Gross Monthly Income": p.grossMonthlyIncome ? `₱${Number(p.grossMonthlyIncome).toLocaleString("en-PH")}` : "",
              Guardian: p.guardianName,
              "Guardian Relationship": p.guardianRelationship,
            }} />
          </ReviewSection>

          {Object.keys(app.formData?.customAnswers || {}).length ? (
            <ReviewSection title="C. Additional Scholarship Answers"><RecordGrid entries={app.formData.customAnswers} /></ReviewSection>
          ) : null}

          <ReviewSection title="D. LGU Scholars Policy Agreement">
            <RecordGrid entries={{
              "Parent / Guardian Name": policy.parentGuardianName,
              "Student Name": policy.studentName || s.fullName,
              Barangay: policy.barangay,
              "Policy Agreement": policy.accepted ? "Accepted" : "Not Accepted",
            }} />
          </ReviewSection>

          <div className="review-media-grid">
            {app.photoDataUrl ? <section className="panel-card review-media"><span>2×2 PHOTO</span><img className="review-photo" src={app.photoDataUrl} alt="Applicant" /></section> : null}
            {app.signatureDataUrl ? <section className="panel-card review-media"><span>APPLICANT ELECTRONIC SIGNATURE</span><img className="review-signature" src={app.signatureDataUrl} alt="Electronic signature" /><small>Authenticated UID: {app.signatureAudit?.signedByUid}</small><small>Signed: {formatDateTime(app.signatureAudit?.signedAt)}</small></section> : null}
            {policy.parentSignatureDataUrl ? <section className="panel-card review-media"><span>PARENT / GUARDIAN SIGNATURE</span><img className="review-signature" src={policy.parentSignatureDataUrl} alt="Parent or guardian electronic signature" /><small>Submitted as part of the LGU Scholars Policy Agreement.</small></section> : null}
          </div>
        </div>

        <aside className="review-decision">
          <form className="panel-card decision-card" onSubmit={submit}>
            <span>ADMINISTRATIVE ACTION</span>
            <h2>Assessment & Decision</h2>

            <label className="field-label">Application status
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                <option value="pending">Pending Review</option>
                <option value="revision_required">For Revision</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </label>

            <label className="field-label">Assessment / Evaluation
              <textarea rows="5" value={form.assessment} onChange={(e) => setForm((f) => ({ ...f, assessment: e.target.value }))} placeholder="Briefly describe the evaluator's assessment." />
            </label>

            <label className="field-label">Remarks to applicant
              <textarea rows="5" value={form.remarks} onChange={(e) => setForm((f) => ({ ...f, remarks: e.target.value }))} placeholder={form.status === "revision_required" ? "State exactly what the student must revise." : "Optional message shown to the student."} />
            </label>

            {form.status === "revision_required" && !form.remarks.trim() ? <div className="form-alert warning">Revision remarks are strongly recommended so the student knows what to correct.</div> : null}

            {form.status === "approved" ? (
              <div className="official-approval-admin-box">
                <div className="official-approval-admin-heading">
                  <div className="official-approval-admin-icon"><ImagePlus size={19} /></div>
                  <div><span>OFFICIAL APPROVAL</span><h3>Municipal Mayor Signature</h3><p>Upload only an authorized signature image approved for official scholarship documents.</p></div>
                </div>

                <div className="official-signatory-fields">
                  <label className="field-label">Printed name<input value={form.approvalSignatoryName} onChange={(e) => setForm((f) => ({ ...f, approvalSignatoryName: e.target.value }))} /></label>
                  <label className="field-label">Official title<input value={form.approvalSignatoryTitle} onChange={(e) => setForm((f) => ({ ...f, approvalSignatoryTitle: e.target.value }))} /></label>
                </div>

                {form.approvalSignatureDataUrl ? (
                  <div className="official-approval-signature-preview">
                    <img src={form.approvalSignatureDataUrl} alt="Authorized approval signature preview" />
                    <button type="button" className="button button-secondary button-sm" onClick={() => setForm((f) => ({ ...f, approvalSignatureDataUrl: "", approvalSignatureAuthorized: false }))}><Trash2 size={15} /> Remove</button>
                  </div>
                ) : (
                  <label className="official-signature-upload">
                    <ImagePlus size={20} />
                    <span>{signatureLoading ? "Processing signature…" : "Choose authorized signature image"}</span>
                    <small>PNG, JPG, or WebP. The image is compressed before being stored with this application.</small>
                    <input type="file" accept="image/png,image/jpeg,image/webp" disabled={signatureLoading} onChange={(e) => handleApprovalSignature(e.target.files?.[0])} />
                  </label>
                )}

                <label className="official-authorization-check">
                  <input type="checkbox" checked={form.approvalSignatureAuthorized} onChange={(e) => setForm((f) => ({ ...f, approvalSignatureAuthorized: e.target.checked }))} />
                  <span>I confirm that this signature image is authorized for use on this approved scholarship application.</span>
                </label>
              </div>
            ) : null}

            <button className="button button-primary button-block" disabled={saving || signatureLoading}>
              <Save size={17} />{saving ? "Saving decision…" : "Save decision & notify student"}
            </button>
          </form>

          <section className="panel-card timeline-card"><span>STATUS HISTORY</span>{Object.values(app.statusHistory || {}).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0)).map((item) => <div className="timeline-item" key={item.timestamp}><Clock3 size={16} /><div><strong>{item.label}</strong><small>{formatDateTime(item.timestamp)}</small></div></div>)}</section>
          <div className="decision-note"><CheckCircle2 size={18} /><span>Status updates and notifications are saved through one Firebase multi-location update.</span></div>
        </aside>
      </div>

      <OfficialApplicationPrint application={app} />
    </>
  );
}

function ReviewSection({ title, children }) {
  return <section className="panel-card record-section review-record"><h2>{title}</h2>{children}</section>;
}

function RecordGrid({ entries }) {
  return <div className="record-grid">{Object.entries(entries).map(([label, value]) => <div key={label}><span>{label}</span><strong>{Array.isArray(value) ? value.join(", ") : value || "—"}</strong></div>)}</div>;
}
