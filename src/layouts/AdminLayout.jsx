import { BellRing, ClipboardCheck, FilePenLine, Gauge, GraduationCap, History, LogOut, Menu, Settings2, UsersRound, X } from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/auth.service";
export default function AdminLayout() {
    const [open, setOpen] = useState(false);
    const { profile } = useAuth();
    const navigate = useNavigate();
    const initials = (profile?.fullName || "Administrator").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    async function handleLogout() {
        await logout();
        navigate("/");
    }
    return (<div className="app-shell admin-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <img src="/paranas-seal.png" alt="Paranas seal"/>
          <div><strong>LGU Scholars</strong><small>Administration</small></div>
          <button className="sidebar-close" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <div className="sidebar-label">ADMINISTRATION</div>
        <nav className="sidebar-nav">
          <NavLink to="/admin" end><Gauge size={19}/> Dashboard</NavLink>
          <NavLink to="/admin/scholarships"><GraduationCap size={19}/> Scholarships</NavLink>
          <NavLink to="/admin/scholarships/new"><FilePenLine size={19}/> Create Scholarship</NavLink>
          <NavLink to="/admin/applicants"><UsersRound size={19}/> Applicants</NavLink>
          <NavLink to="/admin/reviews"><ClipboardCheck size={19}/> Review Queue</NavLink>
          <NavLink to="/admin/site-content"><Settings2 size={19}/> Website Content</NavLink>
          <NavLink to="/admin/activity"><History size={19}/> Activity Logs</NavLink>
        </nav>
        <div className="sidebar-notice"><BellRing size={18}/><div><strong>Realtime workflow</strong><span>Decisions are saved to Firebase and shown to students immediately.</span></div></div>
        <div className="sidebar-footer">
          <Link to="/" className="back-public">View public website</Link>
          <button onClick={handleLogout}><LogOut size={18}/> Sign out</button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button className="topbar-menu" onClick={() => setOpen(true)}><Menu size={22}/></button>
          <div className="topbar-context"><span>Administration</span><strong>Scholarship Management System</strong></div>
          <div className="user-menu-static"><div className="avatar admin-avatar">{initials}</div><div><strong>{profile?.fullName || "Administrator"}</strong><small>System administrator</small></div></div>
        </header>
        <main className="workspace"><Outlet /></main>
      </div>
      {open ? <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close navigation"/> : null}
    </div>);
}

