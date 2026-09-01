import { ArrowLeft, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { humanizeFirebaseError } from "../../utils/validation";

function destinationForRole(role) {
  return role === "admin" ? "/admin" : "/student";
}

function isAllowedReturnPath(path, role) {
  if (!path || typeof path !== "string") return false;
  const base = destinationForRole(role);
  return path === base || path.startsWith(`${base}/`);
}

export default function LoginPage() {
  const { user, profile, loading, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user && profile) {
    return <Navigate to={destinationForRole(profile.role)} replace />;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      // signIn() now returns only after the Firebase user AND RTDB profile
      // have both been resolved and written into AuthContext.
      const session = await signIn(email, password);
      const role = session.profile?.role === "admin" ? "admin" : "student";
      const defaultDestination = destinationForRole(role);
      const intended = location.state?.from;

      navigate(
        isAllowedReturnPath(intended, role) ? intended : defaultDestination,
        { replace: true },
      );
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-brand-panel">
        <Link to="/" className="auth-back">
          <ArrowLeft size={17} /> Back to website
        </Link>
        <div className="auth-brand-content">
          <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
          <span>LGU SCHOLARSHIP PROGRAM</span>
          <h1>One account for your entire scholarship journey.</h1>
          <p>
            Apply online, monitor your status, receive revision instructions,
            and keep your application record accessible.
          </p>
          <div className="auth-trust">
            <ShieldCheck size={20} />
            <span>
              Protected by Firebase Authentication and role-based database
              rules.
            </span>
          </div>
        </div>
      </div>

      <div className="auth-form-panel">
        <form className="auth-card" onSubmit={handleSubmit}>
          <div className="auth-card-heading">
            <span>WELCOME BACK</span>
            <h2>Sign in to your account</h2>
            <p>
              Use the email address you registered for the scholarship portal.
            </p>
          </div>

          {error ? <div className="form-alert error">{error}</div> : null}

          <label className="field-label">
            Email address
            <div className="input-with-icon">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="student@example.com"
              />
            </div>
          </label>

          <label className="field-label">
            Password
            <div className="input-with-icon">
              <LockKeyhole size={18} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                autoComplete="current-password"
                placeholder="Enter your password"
              />
            </div>
          </label>

          <button
            className="button button-primary button-block button-lg"
            disabled={submitting || loading}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>

          <div className="auth-divider">
            <span>New applicant?</span>
          </div>

          <Link className="button button-secondary button-block" to="/register">
            Create a student account
          </Link>

          <p className="auth-help">
            Administrator accounts are assigned by the system administrator in
            Firebase and cannot be self-registered.
          </p>
        </form>
      </div>
    </div>
  );
}
