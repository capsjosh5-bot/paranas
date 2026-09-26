import { Bell, CheckCheck, ArrowRight, GraduationCap, FileText, Trophy, Megaphone, Info } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import PageHeader from "../../components/common/PageHeader";
import EmptyState from "../../components/common/EmptyState";
import { useAuth } from "../../hooks/useAuth";

import {
    markAllNotificationsRead,
    markNotificationRead,
    subscribeNotifications
} from "../../services/notification.service";

import { formatDateTime } from "../../utils/date";

import "../../styles/notifications.css";

export default function NotificationsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [items, setItems] = useState([]);

    useEffect(() => {
        return subscribeNotifications(user.uid, setItems);
    }, [user.uid]);

    async function openNotification(note) {
        await markNotificationRead(user.uid, note.id);

        if (note.scholarshipId) {
            navigate(`/scholarships/${note.scholarshipId}`);
        }
    }

    async function readAll() {
        await markAllNotificationsRead(user.uid, items);
    }

    function getIcon(index) {
        const icons = [
            GraduationCap,
            FileText,
            Trophy,
            Megaphone,
            Info
        ];

        const Icon = icons[index % icons.length];
        return <Icon size={24} />;
    }

    return (
        <>
            <PageHeader
                eyebrow="STUDENT PORTAL"
                title="Notifications"
                description="Stay updated with new scholarship opportunities and important application announcements."
                actions={
                    items.some((n) => !n.read) && (
                        <button className="premium-read-button" onClick={readAll}>
                            <CheckCheck size={17}/>
                            Mark all as read
                        </button>
                    )
                }
            />

            {items.length ? (
                <section className="notification-modern-wrapper">

                    <div className="notification-modern-card">

                        {items.map((note, index) => (
                            <button
                                key={note.id}
                                onClick={() => openNotification(note)}
                                className={`modern-notification-item ${!note.read ? "new" : ""}`}
                            >

                                <div className="modern-notification-icon">
                                    {getIcon(index)}
                                    {!note.read && <span />}
                                </div>

                                <div className="modern-notification-body">

                                    <div className="modern-title-row">
                                        <h3>{note.title}</h3>
                                        <time>{formatDateTime(note.createdAt)}</time>
                                    </div>

                                    <p>{note.message}</p>

                                    <div className="modern-action">
                                        {note.scholarshipId
                                            ? "Open scholarship details"
                                            : note.read
                                            ? "Read"
                                            : "Click to mark as read"}

                                        {note.scholarshipId && (
                                            <ArrowRight size={17}/>
                                        )}
                                    </div>

                                </div>

                            </button>
                        ))}

                    </div>

                </section>
            ) : (
                <EmptyState
                    title="No notifications"
                    description="Scholarship announcements and application updates will appear here."
                />
            )}
        </>
    );
}