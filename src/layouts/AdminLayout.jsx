import {
  BarChart3,
  ClipboardCheck,
  ExternalLink,
  FilePenLine,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  UsersRound,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const groups = [
  {
    label: "OVERVIEW",
    items: [{ to: "/admin", end: true, icon: LayoutDashboard, label: "Dashboard" }],
  },
  {
    label: "PROGRAMS",
    items: [
      { to: "/admin/scholarships", icon: GraduationCap, label: "Scholarships" },
      { to: "/admin/scholarships/new", icon: FilePenLine, label: "Create Scholarship" },
    ],
  },
  {
    label: "APPLICATIONS",
    items: [
      { to: "/admin/applicants", icon: UsersRound, label: "Applicants" },
      { to: "/admin/reviews", icon: ClipboardCheck, label: "Review Queue" },
    ],
  },
  {
    label: "CONTENT & REPORTS",
    items: [
      { to: "/admin/site-content", icon: Settings2, label: "Website Content" },
      { to: "/admin/reports", icon: BarChart3, label: "Reports" },
      { to: "/admin/activity", icon: History, label: "Activity Logs" },
    ],
  },
];

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const initials = (profile?.fullName || "Scholarship Administrator")
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell admin-shell admin-shell-v3">
      <aside className={open ? "sidebar admin-sidebar-v3 open" : "sidebar admin-sidebar-v3"}>
        <div className="sidebar-brand admin-sidebar-brand-v3">
          <img src="/paranas-seal.png" alt="Municipality of Paranas seal" />
          <div>
            <strong>LGU Scholarship</strong>
            <small>Paranas, Samar</small>
          </div>
          <button className="sidebar-close" onClick={() => setOpen(false)} aria-label="Close navigation">
            <X size={20} />
          </button>
        </div>

        <nav className="admin-nav-v3" aria-label="Administration navigation">
          {groups.map((group) => (
            <div className="admin-nav-group" key={group.label}>
              <div className="sidebar-label">{group.label}</div>
              <div className="sidebar-nav">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      onClick={() => setOpen(false)}
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="sidebar-footer admin-sidebar-footer-v3">
          <Link to="/" target="_blank" rel="noreferrer">
            <ExternalLink size={17} />
            <span>View public website</span>
          </Link>
          <button onClick={handleLogout}>
            <LogOut size={17} />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <div className="app-main">
        <header className="app-topbar admin-topbar-v3">
          <button className="topbar-menu" onClick={() => setOpen(true)} aria-label="Open navigation">
            <Menu size={22} />
          </button>
          <div className="admin-topbar-spacer" />
          <div className="admin-topbar-actions">
            <Link className="admin-topbar-public" to="/" target="_blank" rel="noreferrer">
              <ExternalLink size={16} />
              Public website
            </Link>
            <div className="user-menu-static admin-user-chip">
              <div className="avatar admin-avatar">{initials}</div>
              <div>
                <strong>{profile?.fullName || "Scholarship Administrator"}</strong>
                <small>System administrator</small>
              </div>
            </div>
          </div>
        </header>

        <main className="workspace admin-workspace-v3">
          <Outlet />
        </main>
      </div>

      {open ? (
        <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close navigation" />
      ) : null}
    </div>
  );
}
