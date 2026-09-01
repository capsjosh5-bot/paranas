import { Bell, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";
import { markAllNotificationsRead, markNotificationRead, subscribeNotifications } from "../../services/notification.service";
import { formatDateTime } from "../../utils/date";
export default function NotificationsPage() {
    const { user } = useAuth();
    const [items, setItems] = useState([]);
    useEffect(() => subscribeNotifications(user.uid, setItems), [user.uid]);
    async function read(id) { await markNotificationRead(user.uid, id); }
    async function readAll() { await markAllNotificationsRead(user.uid, items); }
    return <><PageHeader eyebrow="STUDENT PORTAL" title="Notifications" description="Administrative decisions and revision instructions for your scholarship applications." actions={items.some((n) => !n.read) ? <button className="button button-secondary" onClick={readAll}><CheckCheck size={17}/> Mark all as read</button> : null}/>
 {items.length ? <div className="notifications-panel">{items.map((note) => <button key={note.id} onClick={() => read(note.id)} className={note.read ? "notification-card" : "notification-card unread"}><div className="notification-icon"><Bell size={19}/></div><div><div className="notification-title-row"><strong>{note.title}</strong><span>{formatDateTime(note.createdAt)}</span></div><p>{note.message}</p>{!note.read ? <small>Click to mark as read</small> : <small>Read</small>}</div></button>)}</div> : <EmptyState title="No notifications" description="Your scholarship status updates and revision notices will appear here."/>}</>;
}

