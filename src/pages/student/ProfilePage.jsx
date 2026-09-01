import {
  CheckCircle2,
  Home,
  Mail,
  MapPin,
  Phone,
  Save,
  UserRound,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import { useAuth } from "../../hooks/useAuth";
import { updateOwnProfile } from "../../services/auth.service";
import { humanizeFirebaseError } from "../../utils/validation";

export default function ProfilePage() {
  const { user, profile, refreshProfile } = useAuth();
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    barangay: "",
  });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm({
      fullName: profile?.fullName || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
      barangay: profile?.barangay || "",
    });
  }, [profile]);

  const initials = useMemo(() => {
    const name = String(profile?.fullName || form.fullName || "Student").trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (!parts.length) return "S";
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }, [profile?.fullName, form.fullName]);

  function change(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");

    try {
      await updateOwnProfile(user.uid, {
        fullName: form.fullName.trim(),
        phone: form.phone.trim(),
        barangay: form.barangay.trim(),
        address: form.address.trim(),
      });
      await refreshProfile();
      setMessage("Your profile information has been updated successfully.");
    } catch (err) {
      setError(humanizeFirebaseError(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="STUDENT ACCOUNT"
        title="My Profile"
        description="Keep your personal and contact information accurate for a smoother scholarship application process."
      />

      <section className="student-profile-hero" aria-label="Student profile summary">
        <div className="student-profile-avatar" aria-hidden="true">
          {initials}
        </div>
        <div className="student-profile-identity">
          <span className="student-profile-kicker">Scholarship applicant profile</span>
          <h2>{profile?.fullName || form.fullName || "Student Applicant"}</h2>
          <div className="student-profile-email">
            <Mail size={16} />
            <span>{profile?.email || user?.email || ""}</span>
          </div>
        </div>
        <div className="student-profile-purpose">
          <CheckCircle2 size={19} />
          <div>
            <strong>Application-ready information</strong>
            <span>Your saved details can be used consistently across scholarship applications.</span>
          </div>
        </div>
      </section>

      <form className="student-profile-form panel-card" onSubmit={submit}>
        <div className="student-profile-form-head">
          <div>
            <span className="student-profile-section-label">PROFILE DETAILS</span>
            <h2>Personal information</h2>
            <p>Use your complete legal name and an active contact number.</p>
          </div>
          <div className="student-profile-form-badge">
            <UserRound size={17} />
            Student Profile
          </div>
        </div>

        {message ? <div className="form-alert success">{message}</div> : null}
        {error ? <div className="form-alert error">{error}</div> : null}

        <div className="student-profile-section">
          <div className="student-profile-section-title">
            <div className="student-profile-section-icon"><UserRound size={18} /></div>
            <div>
              <h3>Basic information</h3>
              <p>Information used to identify your scholarship application.</p>
            </div>
          </div>

          <div className="student-profile-grid">
            <label className="field-label student-profile-field full">
              <span>Full name</span>
              <div className="student-profile-input-wrap">
                <UserRound size={18} />
                <input
                  value={form.fullName}
                  onChange={(event) => change("fullName", event.target.value)}
                  required
                  autoComplete="name"
                  placeholder="Enter your complete name"
                />
              </div>
            </label>

            <label className="field-label student-profile-field full">
              <span>Email address</span>
              <div className="student-profile-input-wrap student-profile-readonly">
                <Mail size={18} />
                <input
                  value={profile?.email || user?.email || ""}
                  disabled
                  aria-describedby="profile-email-help"
                />
                <span className="student-profile-readonly-tag">Login email</span>
              </div>
              <small id="profile-email-help" className="student-profile-field-help">
                Your sign-in email is managed through your account and is not changed from this form.
              </small>
            </label>
          </div>
        </div>

        <div className="student-profile-divider" />

        <div className="student-profile-section">
          <div className="student-profile-section-title">
            <div className="student-profile-section-icon"><MapPin size={18} /></div>
            <div>
              <h3>Contact & residence</h3>
              <p>Provide current information so the scholarship office can reach you when necessary.</p>
            </div>
          </div>

          <div className="student-profile-grid two-column">
            <label className="field-label student-profile-field">
              <span>Mobile number</span>
              <div className="student-profile-input-wrap">
                <Phone size={18} />
                <input
                  type="tel"
                  inputMode="tel"
                  value={form.phone}
                  onChange={(event) => change("phone", event.target.value)}
                  autoComplete="tel"
                  placeholder="09XX XXX XXXX"
                />
              </div>
            </label>

            <label className="field-label student-profile-field">
              <span>Barangay</span>
              <div className="student-profile-input-wrap">
                <MapPin size={18} />
                <input
                  value={form.barangay}
                  onChange={(event) => change("barangay", event.target.value)}
                  autoComplete="address-level3"
                  placeholder="Barangay in Paranas"
                />
              </div>
            </label>

            <label className="field-label student-profile-field full">
              <span>Complete address</span>
              <div className="student-profile-textarea-wrap">
                <Home size={18} />
                <textarea
                  rows="4"
                  value={form.address}
                  onChange={(event) => change("address", event.target.value)}
                  autoComplete="street-address"
                  placeholder="House/Purok, Barangay, Paranas, Samar"
                />
              </div>
            </label>
          </div>
        </div>

        <div className="student-profile-savebar">
          <div>
            <strong>Keep your details current</strong>
            <span>Review your information before submitting a new scholarship application.</span>
          </div>
          <button className="button button-primary student-profile-save" type="submit" disabled={saving}>
            <Save size={18} />
            {saving ? "Saving changes…" : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
