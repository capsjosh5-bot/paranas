import { ExternalLink, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { DEFAULT_SITE_CONTENT, getSiteContent, saveSiteContent } from "../../services/content.service";
import { humanizeFirebaseError } from "../../utils/validation";

export default function SiteContentPage() {
  const { user } = useAuth();
  const [form, setForm] = useState(DEFAULT_SITE_CONTENT);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { getSiteContent().then(setForm); }, []);
  function change(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  async function submit(e) {
    e.preventDefault(); setSaving(true); setMessage(""); setError("");
    try { setForm(await saveSiteContent(form, user.uid)); setMessage("Website content updated successfully."); }
    catch (err) { setError(humanizeFirebaseError(err)); }
    finally { setSaving(false); }
  }

  return <div className="admin-page-pro"><PageHeader eyebrow="PUBLIC WEBSITE" title="Website Content" description="Update the main public messages and municipality information shown to visitors." actions={<Link className="button button-secondary" to="/" target="_blank"><ExternalLink size={17}/> Preview website</Link>} />
    <form className="admin-content-editor-pro" onSubmit={submit}>
      {message ? <div className="form-alert success">{message}</div> : null}{error ? <div className="form-alert error">{error}</div> : null}
      <section className="panel-card admin-content-section"><div className="form-section-heading"><span>01</span><div><h2>Homepage message</h2><p>Primary scholarship message shown to public visitors.</p></div></div><div className="form-grid"><label className="field-label full">Hero headline<input value={form.heroTitle} onChange={(e) => change("heroTitle", e.target.value)}/></label><label className="field-label full">Hero description<textarea rows="4" value={form.heroText} onChange={(e) => change("heroText", e.target.value)}/></label></div></section>
      <section className="panel-card admin-content-section"><div className="form-section-heading"><span>02</span><div><h2>About Paranas</h2><p>Municipality profile and historical introduction.</p></div></div><div className="form-grid"><label className="field-label full">Section title<input value={form.aboutTitle} onChange={(e) => change("aboutTitle", e.target.value)}/></label><label className="field-label full">Municipality description<textarea rows="5" value={form.aboutText} onChange={(e) => change("aboutText", e.target.value)}/></label><label className="field-label full">Municipal history<textarea rows="4" value={form.historyText} onChange={(e) => change("historyText", e.target.value)}/></label></div></section>
      <section className="panel-card admin-content-section"><div className="form-section-heading"><span>03</span><div><h2>Program Policy</h2><p>Introductory text shown before scholarship responsibilities and conditions.</p></div></div><label className="field-label">Policy introduction<textarea rows="5" value={form.policyIntro} onChange={(e) => change("policyIntro", e.target.value)}/></label></section>
      <div className="admin-sticky-save"><span>Save changes when the public content is ready.</span><button className="button button-primary" disabled={saving}><Save size={17}/>{saving ? "Saving…" : "Save website content"}</button></div>
    </form>
  </div>;
}
