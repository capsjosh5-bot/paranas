import { Mail, MapPin, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { SITE } from "../config/site";
import { useAuth } from "../hooks/useAuth";

export default function PublicLayout() {
  const [open, setOpen] = useState(false);
  const { user, profile } = useAuth();
  const dashboardLink = profile?.role === "admin" ? "/admin" : "/student";

  return (
    <div className="public-shell reference-public-shell">
      <header className="public-header reference-header">
        <div className="public-header-inner reference-header-inner">
          <Link className="brand reference-brand" to="/" onClick={() => setOpen(false)}>
            <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
            <span>
              <strong>LGU Scholarship Program</strong>
              <small>Municipality of Paranas, Samar</small>
            </span>
          </Link>

          <button
            className="mobile-nav-toggle reference-mobile-nav"
            onClick={() => setOpen((value) => !value)}
            aria-label="Toggle navigation"
            type="button"
          >
            {open ? <X /> : <Menu />}
          </button>

          <nav className={open ? "public-nav reference-nav open" : "public-nav reference-nav"}>
            <NavLink to="/" end onClick={() => setOpen(false)}>Home</NavLink>
            <NavLink to="/scholarships" onClick={() => setOpen(false)}>Scholarships</NavLink>
            <NavLink to="/program-policy" onClick={() => setOpen(false)}>Program Policy</NavLink>
            <NavLink to="/about" onClick={() => setOpen(false)}>About Paranas</NavLink>

            {user ? (
              <Link
                to={dashboardLink}
                className="reference-header-account"
                onClick={() => setOpen(false)}
              >
                Open Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="reference-signin" onClick={() => setOpen(false)}>
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="reference-create-account"
                  onClick={() => setOpen(false)}
                >
                  Create Account
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main><Outlet /></main>

      <footer className="public-footer reference-footer">
        <div className="reference-footer-main">
          <div className="reference-footer-brand">
            <div className="reference-footer-brand-heading">
              <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
              <div>
                <strong>LGU Scholarship Program</strong>
                <span>Municipality of Paranas, Samar</span>
              </div>
            </div>
            <p>Empowering students. Building the future of Paranas.</p>
          </div>

          <div className="reference-footer-column">
            <h4>Quick Links</h4>
            <Link to="/">Home</Link>
            <Link to="/scholarships">Scholarships</Link>
            <Link to="/program-policy">Program Policy</Link>
            <Link to="/about">About Paranas</Link>
          </div>

          <div className="reference-footer-column">
            <h4>Applicant Access</h4>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Create Account</Link>
            <Link to="/student">Student Dashboard</Link>
          </div>

          <div className="reference-footer-column">
            <h4>Contact</h4>
            <span><MapPin size={15} /> {SITE.address}</span>
            <a href={`mailto:${SITE.supportEmail}`}><Mail size={15} /> {SITE.supportEmail}</a>
          </div>
        </div>

        <div className="reference-footer-bottom">
          <span>© {new Date().getFullYear()} LGU Scholarship Program — Municipality of Paranas, Samar.</span>
          <span>Official scholarship application and monitoring portal</span>
        </div>
      </footer>
    </div>
  );
}
