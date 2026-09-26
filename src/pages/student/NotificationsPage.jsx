import { Bell, CheckCheck, ArrowRight } from "lucide-react";
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

    return (
        <>
            <PageHeader
                eyebrow="STUDENT PORTAL"
                title="Notifications"
                description="Stay updated with new scholarship opportunities and important application announcements."
                actions={
                    items.some((n) => !n.read) && (
                        <button
                            className="button button-secondary"
                            onClick={readAll}
                        >
                            <CheckCheck size={17}/>
                            Mark all as read
                        </button>
                    )
                }
            />

            {items.length ? (
                <div className="notifications-panel professional-notifications">

                    {items.map((note) => (
                        <button
                            key={note.id}
                            onClick={() => openNotification(note)}
                            className={
                                note.read
                                ? "notification-card professional-card"
                                : "notification-card professional-card unread"
                            }
                        >

                            <div className="notification-icon premium-icon">
                                <Bell size={22}/>
                            </div>


                            <div className="notification-content">

                                <div className="notification-title-row">
                                    <strong>
                                        {note.title}
                                    </strong>

                                    <span>
                                        {formatDateTime(note.createdAt)}
                                    </span>
                                </div>


                                <p>
                                    {note.message}
                                </p>


                                <div className="notification-footer">

                                    <small>
                                        {note.scholarshipId
                                            ? "Open scholarship details"
                                            : note.read
                                            ? "Read"
                                            : "Click to mark as read"}
                                    </small>


                                    {note.scholarshipId && (
                                        <ArrowRight size={17}/>
                                    )}

                                </div>

                            </div>

                        </button>
                    ))}

                </div>
            ) : (
                <EmptyState
                    title="No notifications"
                    description="Scholarship announcements and application updates will appear here."
                />
            )}
        </>
    );
}
