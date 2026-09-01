import { ArrowLeft, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { registerStudent } from "../../services/auth.service";
import { humanizeFirebaseError, validEmail } from "../../utils/validation";
export default function RegisterPage() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();
    const [form, setForm] = useState({ fullName: "", email: "", phone: "", password: "", confirmPassword: "" });
    const [error, setError] = useState("");
    const [submitting, setSubmitting] = useState(false);
    if (!loading && user && profile)
        return <Navigate to={profile.role === "admin" ? "/admin" : "/student"} replace/>;
    function change(field, value) { setForm((current) => ({ ...current, [field]: value })); }
    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        if (!validEmail(form.email))
            return setError("Enter a valid email address.");
        if (form.password.length < 6)
            return setError("Password must contain at least 6 characters.");
        if (form.password !== form.confirmPassword)
            return setError("Passwords do not match.");
        setSubmitting(true);
        try {
            await registerStudent(form);
            navigate("/student", { replace: true });
        }
        catch (err) {
            setError(humanizeFirebaseError(err));
        }
        finally {
            setSubmitting(false);
        }
    }
    return (<div className="auth-page register-auth">
      <div className="auth-brand-panel">
        <Link to="/" className="auth-back"><ArrowLeft size={17}/> Back to website</Link>
        <div className="auth-brand-content"><img src="/paranas-seal.png" alt="Municipality of Paranas seal"/><span>STUDENT REGISTRATION</span><h1>Create your scholarship portal account.</h1><p>Your account is used to authenticate applications, electronic signatures, revisions, and official scholarship decisions.</p></div>
      </div>
      <div className="auth-form-panel">
        <form className="auth-card register-card" onSubmit={handleSubmit}>
          <div className="auth-card-heading"><span>GET STARTED</span><h2>Student account registration</h2><p>Use accurate information that matches your scholarship application.</p></div>
          {error ? <div className="form-alert error">{error}</div> : null}
          <div className="form-two-col">
            <label className="field-label full">Full name<div className="input-with-icon"><UserRound size={18}/><input value={form.fullName} onChange={(e) => change("fullName", e.target.value)} required placeholder="Complete legal name"/></div></label>
            <label className="field-label">Email address<div className="input-with-icon"><Mail size={18}/><input type="email" value={form.email} onChange={(e) => change("email", e.target.value)} required placeholder="student@example.com"/></div></label>
            <label className="field-label">Mobile number<div className="input-with-icon"><Phone size={18}/><input type="tel" value={form.phone} onChange={(e) => change("phone", e.target.value)} placeholder="09XX XXX XXXX"/></div></label>
            <label className="field-label">Password<div className="input-with-icon"><LockKeyhole size={18}/><input type="password" value={form.password} onChange={(e) => change("password", e.target.value)} required placeholder="At least 6 characters"/></div></label>
            <label className="field-label">Confirm password<div className="input-with-icon"><LockKeyhole size={18}/><input type="password" value={form.confirmPassword} onChange={(e) => change("confirmPassword", e.target.value)} required placeholder="Repeat password"/></div></label>
          </div>
          <label className="consent-check"><input type="checkbox" required/><span>I certify that the account information I entered is mine and may be used to identify my scholarship application.</span></label>
          <button className="button button-primary button-block button-lg" disabled={submitting}>{submitting ? "Creating account…" : "Create student account"}</button>
          <p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p>
        </form>
      </div>
    </div>);
}

