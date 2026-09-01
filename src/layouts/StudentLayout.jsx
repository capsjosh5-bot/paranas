import { Bell, ClipboardList, GraduationCap, LayoutDashboard, LogOut, Menu, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { logout } from "../services/auth.service";
import { subscribeNotifications } from "../services/notification.service";
export default function StudentLayout() {
    const [open, setOpen] = useState(false);
    const { profile } = useAuth();
    const navigate = useNavigate();
    const [unread, setUnread] = useState(0);
    useEffect(() => {
        if (!profile?.uid)
            return undefined;
        return subscribeNotifications(profile.uid, (items) => setUnread(items.filter((item) => !item.read).length));
    }, [profile?.uid]);
    async function handleLogout() {
        await logout();
        navigate("/");
    }
    const initials = (profile?.fullName || "Student").split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
    return (<div className="app-shell">
      <aside className={open ? "sidebar open" : "sidebar"}>
        <div className="sidebar-brand">
          <img src="/paranas-seal.png" alt="Paranas seal"/>
          <div><strong>LGU Scholars</strong><small>Student Portal</small></div>
          <button className="sidebar-close" onClick={() => setOpen(false)}><X size={20}/></button>
        </div>
        <div className="sidebar-label">MY SCHOLARSHIP</div>
        <nav className="sidebar-nav">
          <NavLink to="/student" end><LayoutDashboard size={19}/> Dashboard</NavLink>
          <NavLink to="/student/applications"><ClipboardList size={19}/> My Applications</NavLink>
          <NavLink to="/student/scholarships"><GraduationCap size={19}/> Browse Scholarships</NavLink>
          <NavLink to="/student/notifications"><Bell size={19}/> Notifications</NavLink>
          <NavLink to="/student/profile"><UserRound size={19}/> My Profile</NavLink>
        </nav>
        <div className="sidebar-footer">
          <Link to="/" className="back-public">Public website</Link>
          <button onClick={handleLogout}><LogOut size={18}/> Sign out</button>
        </div>
      </aside>
      <div className="app-main">
        <header className="app-topbar">
          <button className="topbar-menu" onClick={() => setOpen(true)}><Menu size={22}/></button>
          <div className="topbar-context"><span>Student Portal</span><strong>Scholarship Application Workspace</strong></div>
          <div className="topbar-user-group"><Link to="/student/notifications" className="topbar-notification" aria-label="Notifications"><Bell size={19}/>{unread > 0 ? <span>{unread > 9 ? "9+" : unread}</span> : null}</Link><div className="user-menu-static"><div className="avatar">{initials}</div><div><strong>{profile?.fullName || "Student"}</strong><small>{profile?.email || ""}</small></div></div></div>
        </header>
        <main className="workspace"><Outlet /></main>
      </div>
      {open ? <button className="sidebar-overlay" onClick={() => setOpen(false)} aria-label="Close navigation"/> : null}
    </div>);
}

