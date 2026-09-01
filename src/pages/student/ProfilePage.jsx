import { Save, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { updateOwnProfile } from "../../services/auth.service";
import { humanizeFirebaseError } from "../../utils/validation";
export default function ProfilePage() {
    const { user, profile, refreshProfile } = useAuth();
    const [form, setForm] = useState({ fullName: "", phone: "", address: "", barangay: "" });
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [saving, setSaving] = useState(false);
    useEffect(() => { setForm({ fullName: profile?.fullName || "", phone: profile?.phone || "", address: profile?.address || "", barangay: profile?.barangay || "" }); }, [profile]);
    function change(k, v) { setForm((f) => ({ ...f, [k]: v })); }
    async function submit(e) {
        e.preventDefault();
        setSaving(true);
        setMessage("");
        setError("");
        try {
            await updateOwnProfile(user.uid, form);
            await refreshProfile();
            setMessage("Profile updated successfully.");
        }
        catch (err) {
            setError(humanizeFirebaseError(err));
        }
        finally {
            setSaving(false);
        }
    }
    return <><PageHeader eyebrow="ACCOUNT" title="My Profile" description="Keep your contact information accurate so it can be used consistently across your scholarship applications."/><div className="profile-layout"><form className="panel-card profile-form" onSubmit={submit}>{message ? <div className="form-alert success">{message}</div> : null}{error ? <div className="form-alert error">{error}</div> : null}<div className="form-grid"><label className="field-label full">Full name<input value={form.fullName} onChange={(e) => change("fullName", e.target.value)} required/></label><label className="field-label">Email address<input value={profile?.email || ""} disabled/></label><label className="field-label">Mobile number<input value={form.phone} onChange={(e) => change("phone", e.target.value)} placeholder="09XX XXX XXXX"/></label><label className="field-label">Barangay<input value={form.barangay} onChange={(e) => change("barangay", e.target.value)} placeholder="Barangay in Paranas"/></label><label className="field-label full">Complete address<textarea rows="3" value={form.address} onChange={(e) => change("address", e.target.value)} placeholder="House/Purok, Barangay, Paranas, Samar"/></label></div><div className="form-actions"><button className="button button-primary" disabled={saving}><Save size={17}/>{saving ? "Saving…" : "Save profile"}</button></div></form><aside className="panel-card profile-security"><div className="policy-icon"><ShieldCheck size={22}/></div><h2>Account security</h2><p>Your role is <strong>{profile?.role || "student"}</strong>. Students cannot change their own role or grant themselves administrator privileges.</p><div className="account-meta"><span>Firebase UID</span><code>{user.uid}</code></div></aside></div></>;
}

