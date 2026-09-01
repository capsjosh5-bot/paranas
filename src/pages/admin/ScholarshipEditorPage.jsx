import { ArrowLeft, CalendarDays, Plus, Save, TicketCheck, Trash2, WalletCards } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import Loader from "../../components/common/Loader";
import { useAuth } from "../../hooks/useAuth";
import { createScholarship, getAdminScholarship, updateScholarship } from "../../services/scholarship.service";
import { humanizeFirebaseError } from "../../utils/validation";

const blank = {
  title: "", code: "", category: "General Scholarship", description: "", benefits: "", eligibility: "",
  academicYear: "", semester: "", amount: "", maxApplicants: 50, openDate: "", closeDate: "",
  requirements: ["2×2 applicant photo", "Completed online application form", "Electronic signature"],
  customQuestions: [], requirePhoto: true, requireSignature: true, status: "draft",
};

export default function ScholarshipEditorPage() {
  const { id } = useParams();
  const editing = Boolean(id);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(blank);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) getAdminScholarship(id).then((data) => data && setForm(data)).finally(() => setLoading(false));
  }, [editing, id]);

  function change(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function addRequirement() { change("requirements", [...(form.requirements || []), ""]); }
  function changeRequirement(i, v) { change("requirements", form.requirements.map((x, n) => n === i ? v : x)); }
  function removeRequirement(i) { change("requirements", form.requirements.filter((_, n) => n !== i)); }
  function addQuestion() { change("customQuestions", [...(form.customQuestions || []), { id: `q_${Date.now()}`, label: "", type: "text", required: false, options: [] }]); }
  function updateQuestion(i, key, value) { change("customQuestions", form.customQuestions.map((q, n) => n === i ? { ...q, [key]: value } : q)); }
  function removeQuestion(i) { change("customQuestions", form.customQuestions.filter((_, n) => n !== i)); }

  async function submit(e) {
    e.preventDefault(); setError("");
    if (!form.title.trim()) return setError("Scholarship title is required.");
    if (!form.closeDate) return setError("Application deadline is required.");
    if (Number(form.maxApplicants) < 1) return setError("Applicant capacity must be at least 1.");
    setSaving(true);
    try {
      if (editing) await updateScholarship(id, form, user.uid);
      else await createScholarship(form, user.uid);
      navigate("/admin/scholarships");
    } catch (err) { setError(humanizeFirebaseError(err)); }
    finally { setSaving(false); }
  }

  if (loading) return <Loader fullPage label="Loading scholarship editor…" />;

  return <div className="admin-page-pro admin-editor-page">
    <PageHeader eyebrow={editing ? "EDIT PROGRAM" : "NEW PROGRAM"} title={editing ? "Edit Scholarship" : "Create Scholarship"} description="Set the public program details, schedule, available application slots, requirements, and form questions." actions={<Link className="button button-secondary" to="/admin/scholarships"><ArrowLeft size={17}/> Back to scholarships</Link>} />
    {error ? <div className="form-alert error">{error}</div> : null}
    <form className="editor-layout admin-editor-layout-pro" onSubmit={submit}>
      <div className="editor-main">
        <section className="panel-card form-section-card admin-form-card-pro">
          <div className="form-section-heading"><span>01</span><div><h2>Program Information</h2><p>Information students see when browsing the scholarship.</p></div></div>
          <div className="form-grid">
            <label className="field-label full">Scholarship title *<input value={form.title} onChange={(e) => change("title", e.target.value)} required placeholder="e.g. LGU College Scholarship Program"/></label>
            <label className="field-label">Program code<input value={form.code} onChange={(e) => change("code", e.target.value)} placeholder="e.g. LGU-CS-2026"/></label>
            <label className="field-label">Category<input value={form.category} onChange={(e) => change("category", e.target.value)}/></label>
            <label className="field-label full">Public description<textarea rows="4" value={form.description} onChange={(e) => change("description", e.target.value)} placeholder="Explain who the program serves and what applicants should know."/></label>
            <label className="field-label full">Benefits<textarea rows="3" value={form.benefits} onChange={(e) => change("benefits", e.target.value)} placeholder="Describe the grant or scholarship support."/></label>
            <label className="field-label full">Eligibility<textarea rows="5" value={form.eligibility} onChange={(e) => change("eligibility", e.target.value)} placeholder="State residency, academic, family, or other eligibility conditions."/></label>
          </div>
        </section>

        <section className="panel-card form-section-card admin-form-card-pro">
          <div className="form-section-heading"><span>02</span><div><h2>Schedule & Capacity</h2><p>Set the application period, grant information, and maximum number of applicants.</p></div></div>
          <div className="form-grid three">
            <label className="field-label">Academic year<input value={form.academicYear} onChange={(e) => change("academicYear", e.target.value)} placeholder="2026–2027"/></label>
            <label className="field-label">Semester<input value={form.semester} onChange={(e) => change("semester", e.target.value)} placeholder="1st Semester"/></label>
            <label className="field-label">Grant amount (PHP)<input type="number" min="0" value={form.amount} onChange={(e) => change("amount", e.target.value)}/></label>
            <label className="field-label">Application opens<input type="date" value={form.openDate} onChange={(e) => change("openDate", e.target.value)}/></label>
            <label className="field-label">Application deadline *<input type="date" value={form.closeDate} onChange={(e) => change("closeDate", e.target.value)} required/></label>
            <label className="field-label">Maximum applicants *<input type="number" min="1" value={form.maxApplicants} onChange={(e) => change("maxApplicants", e.target.value)} required/></label>
          </div>
        </section>

        <section className="panel-card form-section-card admin-form-card-pro">
          <div className="form-section-heading"><span>03</span><div><h2>Application Requirements</h2><p>List the items applicants should prepare before submitting.</p></div></div>
          <div className="repeater-list">{(form.requirements || []).map((req, i) => <div className="repeater-row" key={i}><input value={req} onChange={(e) => changeRequirement(i, e.target.value)} placeholder="Requirement"/><button type="button" className="icon-button danger-text" onClick={() => removeRequirement(i)}><Trash2 size={17}/></button></div>)}</div>
          <button type="button" className="button button-secondary button-sm" onClick={addRequirement}><Plus size={16}/> Add requirement</button>
          <div className="option-row"><label className="toggle-check"><input type="checkbox" checked={form.requirePhoto !== false} onChange={(e) => change("requirePhoto", e.target.checked)}/><span>Require 2×2 applicant photo</span></label><label className="toggle-check"><input type="checkbox" checked={form.requireSignature !== false} onChange={(e) => change("requireSignature", e.target.checked)}/><span>Require electronic signature</span></label></div>
        </section>

        <section className="panel-card form-section-card admin-form-card-pro">
          <div className="form-section-heading"><span>04</span><div><h2>Additional Questions</h2><p>Add only the extra questions needed for this scholarship program.</p></div></div>
          <div className="question-builder-list">{(form.customQuestions || []).map((q, i) => <div className="question-builder-card" key={q.id || i}><div className="question-builder-top"><strong>Question {i + 1}</strong><button type="button" className="icon-button danger-text" onClick={() => removeQuestion(i)}><Trash2 size={17}/></button></div><div className="form-grid"><label className="field-label full">Question label<input value={q.label} onChange={(e) => updateQuestion(i, "label", e.target.value)} placeholder="Enter the question shown to applicants"/></label><label className="field-label">Field type<select value={q.type} onChange={(e) => updateQuestion(i, "type", e.target.value)}><option value="text">Short answer</option><option value="textarea">Paragraph</option><option value="number">Number</option><option value="date">Date</option><option value="email">Email</option><option value="phone">Phone</option><option value="select">Dropdown</option><option value="radio">Multiple choice</option><option value="checkbox">Checkboxes</option></select></label><label className="toggle-check inline-toggle"><input type="checkbox" checked={Boolean(q.required)} onChange={(e) => updateQuestion(i, "required", e.target.checked)}/><span>Required question</span></label>{["select", "radio", "checkbox"].includes(q.type) ? <label className="field-label full">Options <small>One option per line</small><textarea rows="4" value={(q.options || []).join("\n")} onChange={(e) => updateQuestion(i, "options", e.target.value.split("\n"))}/></label> : null}</div></div>)}</div>
          <button type="button" className="button button-secondary" onClick={addQuestion}><Plus size={17}/> Add custom question</button>
        </section>
      </div>

      <aside className="editor-side admin-editor-side-pro">
        <section className="panel-card publish-card admin-publish-card-pro">
          <span>PUBLISHING</span><h2>Program status</h2>
          <label className="field-label">Status<select value={form.status} onChange={(e) => change("status", e.target.value)}><option value="draft">Draft — admin only</option><option value="published">Published — visible publicly</option><option value="archived">Archived</option></select></label>
          <p>Published programs are visible to students and public visitors.</p>
          <button className="button button-primary button-block" disabled={saving}><Save size={17}/>{saving ? "Saving…" : editing ? "Save changes" : "Create scholarship"}</button>
        </section>
        <section className="panel-card admin-program-summary-card">
          <span>PROGRAM SUMMARY</span>
          <SummaryRow icon={TicketCheck} label="Applicant slots" value={Number(form.maxApplicants || 0).toLocaleString()} />
          <SummaryRow icon={CalendarDays} label="Deadline" value={form.closeDate || "Not set"} />
          <SummaryRow icon={WalletCards} label="Grant amount" value={Number(form.amount || 0) ? `₱${Number(form.amount).toLocaleString("en-PH")}` : "Not set"} />
        </section>
      </aside>
    </form>
  </div>;
}

function SummaryRow({ icon: Icon, label, value }) { return <div className="admin-program-summary-row"><span><Icon size={17}/></span><div><small>{label}</small><strong>{value}</strong></div></div>; }
