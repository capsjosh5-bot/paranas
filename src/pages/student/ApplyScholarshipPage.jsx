import { ArrowLeft, ArrowRight, CheckCircle2, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import CustomQuestionField from "../../components/forms/CustomQuestionField";
import PhotoUploader from "../../components/forms/PhotoUploader";
import SignaturePad from "../../components/forms/SignaturePad";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import { getOwnApplication, resubmitApplication, submitApplication } from "../../services/application.service";
import { getPublicScholarship } from "../../services/scholarship.service";
import { humanizeFirebaseError } from "../../utils/validation";
const emptyForm = {
    student: { fullName: "", birthday: "", age: "", sex: "", address: "", phone: "", schoolGraduated: "", schoolYear: "", generalAverage: "", honors: "", course: "", schoolNamePlace: "", messenger: "", fourPs: "" },
    parents: { fatherName: "", fatherAge: "", fatherOccupation: "", motherName: "", motherAge: "", motherOccupation: "", numberOfChildren: "", grossMonthlyIncome: "", guardianName: "", guardianRelationship: "" },
    customAnswers: {},
    certification: false,
};
export default function ApplyScholarshipPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, profile } = useAuth();
    const [scholarship, setScholarship] = useState(null);
    const [existing, setExisting] = useState(null);
    const [form, setForm] = useState(emptyForm);
    const [photo, setPhoto] = useState("");
    const [signature, setSignature] = useState("");
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    useEffect(() => {
        Promise.all([getPublicScholarship(id), getOwnApplication(id, user.uid)]).then(([program, app]) => {
            setScholarship(program);
            setExisting(app);
            if (app?.status === "revision_required") {
                setForm(app.formData || emptyForm);
                setPhoto(app.photoDataUrl || "");
                setSignature(app.signatureDataUrl || "");
            }
            else {
                setForm((f) => ({ ...f, student: { ...f.student, fullName: profile?.fullName || "", phone: profile?.phone || "", address: profile?.address || "" } }));
            }
        }).finally(() => setLoading(false));
    }, [id, user.uid, profile?.fullName, profile?.phone, profile?.address]);
    const revising = existing?.status === "revision_required";
    const locked = existing && !revising;
    const progress = useMemo(() => Math.round((step / 4) * 100), [step]);
    function changeSection(section, key, value) { setForm((f) => ({ ...f, [section]: { ...f[section], [key]: value } })); }
    function changeCustom(id, value) { setForm((f) => ({ ...f, customAnswers: { ...f.customAnswers, [id]: value } })); }
    function validateStep() {
        if (step === 1) {
            const s = form.student;
            if (!s.fullName || !s.birthday || !s.sex || !s.address || !s.phone || !s.course || !s.schoolNamePlace) {
                setError("Please complete all required student information before continuing.");
                return false;
            }
        }
        if (step === 2) {
            const p = form.parents;
            if (!p.fatherName && !p.motherName && !p.guardianName) {
                setError("Provide at least one parent or guardian name.");
                return false;
            }
        }
        if (step === 3) {
            for (const q of scholarship?.customQuestions || []) {
                const v = form.customAnswers[q.id];
                if (q.required && (!v || (Array.isArray(v) && v.length === 0))) {
                    setError(`Please answer: ${q.label}`);
                    return false;
                }
            }
        }
        setError("");
        return true;
    }
    function next() {
        if (validateStep())
            setStep((s) => Math.min(4, s + 1));
    }
    async function submit(e) {
        e.preventDefault();
        setError("");
        if (!form.certification)
            return setError("You must certify that the information is true and correct.");
        if (scholarship.requirePhoto !== false && !photo)
            return setError("A 2×2 applicant photo is required.");
        if (scholarship.requireSignature !== false && !signature)
            return setError("Electronic signature is required.");
        setSubmitting(true);
        try {
            if (revising) {
                await resubmitApplication({ scholarshipId: id, user, formData: form, photoDataUrl: photo, signatureDataUrl: signature });
            }
            else {
                await submitApplication({ scholarship, user, profile, formData: form, photoDataUrl: photo, signatureDataUrl: signature });
            }
            navigate(`/student/applications/${id}`, { replace: true });
        }
        catch (err) {
            setError(humanizeFirebaseError(err));
        }
        finally {
            setSubmitting(false);
        }
    }
    if (loading)
        return <Loader fullPage label="Preparing application form…"/>;
    if (!scholarship)
        return <div className="panel-card"><h1>Scholarship unavailable</h1><p>This scholarship is not currently published.</p></div>;
    if (locked)
        return <div className="panel-card"><h1>Application already submitted</h1><p>Your application is currently locked while it is under review.</p><Link className="button button-primary" to={`/student/applications/${id}`}>View application</Link></div>;
    return <div className="application-form-page">
   <Link to={`/scholarships/${id}`} className="back-link"><ArrowLeft size={17}/> Scholarship details</Link>
   <div className="google-form-banner"><div><span>{revising ? "REVISION REQUEST" : "OFFICIAL ONLINE APPLICATION"}</span><h1>{scholarship.title}</h1><p>Complete every required section. Your authenticated account will be recorded with the submission.</p></div><div className="form-progress-box"><strong>{progress}%</strong><span>Step {step} of 4</span></div></div>
   {revising && existing?.adminReview?.remarks ? <div className="revision-banner"><strong>Administrator revision request</strong><p>{existing.adminReview.remarks}</p></div> : null}
   {error ? <div className="form-alert error sticky-alert">{error}</div> : null}
   <form onSubmit={submit}>
     {step === 1 ? <FormSection title="A. Student's Information" description="Enter information exactly as it should appear on the official scholarship application.">
       <PhotoUploader value={photo} onChange={setPhoto} required={scholarship.requirePhoto !== false}/>
       <div className="form-grid three"><Field label="Complete name" required><input value={form.student.fullName} onChange={(e) => changeSection("student", "fullName", e.target.value)}/></Field><Field label="Birthday" required><input type="date" value={form.student.birthday} onChange={(e) => changeSection("student", "birthday", e.target.value)}/></Field><Field label="Age"><input type="number" min="1" value={form.student.age} onChange={(e) => changeSection("student", "age", e.target.value)}/></Field><Field label="Sex" required><select value={form.student.sex} onChange={(e) => changeSection("student", "sex", e.target.value)}><option value="">Select</option><option>Male</option><option>Female</option><option>Prefer not to say</option></select></Field><Field label="Cellphone number" required><input value={form.student.phone} onChange={(e) => changeSection("student", "phone", e.target.value)}/></Field><Field label="4Ps Member"><select value={form.student.fourPs} onChange={(e) => changeSection("student", "fourPs", e.target.value)}><option value="">Select</option><option>Yes</option><option>No</option></select></Field><Field label="Complete address" required full><textarea rows="3" value={form.student.address} onChange={(e) => changeSection("student", "address", e.target.value)}/></Field><Field label="School graduated"><input value={form.student.schoolGraduated} onChange={(e) => changeSection("student", "schoolGraduated", e.target.value)}/></Field><Field label="School year"><input value={form.student.schoolYear} onChange={(e) => changeSection("student", "schoolYear", e.target.value)} placeholder="e.g. 2025–2026"/></Field><Field label="General average"><input value={form.student.generalAverage} onChange={(e) => changeSection("student", "generalAverage", e.target.value)}/></Field><Field label="Honors received"><input value={form.student.honors} onChange={(e) => changeSection("student", "honors", e.target.value)}/></Field><Field label="Course to be taken" required><input value={form.student.course} onChange={(e) => changeSection("student", "course", e.target.value)}/></Field><Field label="Name and place of school" required full><input value={form.student.schoolNamePlace} onChange={(e) => changeSection("student", "schoolNamePlace", e.target.value)}/></Field><Field label="FB / Messenger account" full><input value={form.student.messenger} onChange={(e) => changeSection("student", "messenger", e.target.value)}/></Field></div>
     </FormSection> : null}
     {step === 2 ? <FormSection title="B. Parent / Guardian Information" description="Provide the family information requested in the official LGU application form."><div className="form-grid three"><Field label="Father's name"><input value={form.parents.fatherName} onChange={(e) => changeSection("parents", "fatherName", e.target.value)}/></Field><Field label="Father's age"><input type="number" value={form.parents.fatherAge} onChange={(e) => changeSection("parents", "fatherAge", e.target.value)}/></Field><Field label="Father's occupation"><input value={form.parents.fatherOccupation} onChange={(e) => changeSection("parents", "fatherOccupation", e.target.value)}/></Field><Field label="Mother's name"><input value={form.parents.motherName} onChange={(e) => changeSection("parents", "motherName", e.target.value)}/></Field><Field label="Mother's age"><input type="number" value={form.parents.motherAge} onChange={(e) => changeSection("parents", "motherAge", e.target.value)}/></Field><Field label="Mother's occupation"><input value={form.parents.motherOccupation} onChange={(e) => changeSection("parents", "motherOccupation", e.target.value)}/></Field><Field label="Number of children"><input type="number" value={form.parents.numberOfChildren} onChange={(e) => changeSection("parents", "numberOfChildren", e.target.value)}/></Field><Field label="Gross monthly family income"><input type="number" value={form.parents.grossMonthlyIncome} onChange={(e) => changeSection("parents", "grossMonthlyIncome", e.target.value)} placeholder="PHP"/></Field><Field label="Guardian name"><input value={form.parents.guardianName} onChange={(e) => changeSection("parents", "guardianName", e.target.value)}/></Field><Field label="Guardian relationship"><input value={form.parents.guardianRelationship} onChange={(e) => changeSection("parents", "guardianRelationship", e.target.value)}/></Field></div></FormSection> : null}
     {step === 3 ? <FormSection title="C. Scholarship-Specific Questions" description={scholarship.customQuestions?.length ? "Answer the additional questions configured by the scholarship administrator." : "This scholarship has no additional questions."}>{scholarship.customQuestions?.length ? <div className="custom-question-list">{scholarship.customQuestions.map((q) => <div className="custom-question-card" key={q.id}><label htmlFor={q.id}>{q.label}{q.required ? <b> *</b> : null}</label><CustomQuestionField question={q} value={form.customAnswers[q.id]} onChange={(v) => changeCustom(q.id, v)}/></div>)}</div> : <div className="compact-empty"><CheckCircle2 size={24}/><p>No additional questions are required for this program.</p></div>}</FormSection> : null}
     {step === 4 ? <FormSection title="D. Certification and Electronic Signature" description="Review your information before submitting. The signature becomes part of your authenticated application record."><div className="review-summary"><div><span>Applicant</span><strong>{form.student.fullName}</strong></div><div><span>Course</span><strong>{form.student.course}</strong></div><div><span>School</span><strong>{form.student.schoolNamePlace}</strong></div><div><span>Scholarship</span><strong>{scholarship.title}</strong></div></div><label className="certification-box"><input type="checkbox" checked={form.certification} onChange={(e) => setForm((f) => ({ ...f, certification: e.target.checked }))}/><span><strong>I hereby certify</strong> that the information provided in this application is true and correct. I understand that false information may result in disqualification from the LGU Scholarship Program.</span></label><SignaturePad value={signature} onChange={setSignature} required={scholarship.requireSignature !== false}/></FormSection> : null}
     <div className="application-form-actions">{step > 1 ? <button type="button" className="button button-secondary" onClick={() => setStep((s) => s - 1)}><ArrowLeft size={17}/> Previous</button> : <span />}{step < 4 ? <button type="button" className="button button-primary" onClick={next}>Continue <ArrowRight size={17}/></button> : <button className="button button-primary" disabled={submitting}><Save size={17}/>{submitting ? (revising ? "Resubmitting…" : "Submitting…") : (revising ? "Resubmit revised application" : "Submit application")}</button>}</div>
   </form>
 </div>;
}
function FormSection({ title, description, children }) { return <section className="google-form-section"><div className="google-section-accent"/><div className="google-section-heading"><h2>{title}</h2><p>{description}</p></div>{children}</section>; }
function Field({ label, required, full, children }) { return <label className={`field-label ${full ? "full" : ""}`}>{label}{required ? <b> *</b> : null}{children}</label>; }

