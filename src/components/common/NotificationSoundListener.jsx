import { useEffect, useRef } from "react";
import { useAuth } from "../../hooks/useAuth";
import { subscribeNotifications } from "../../services/notification.service";

export default function NotificationSoundListener() {
  const { profile } = useAuth();
  const previous = useRef(new Set());

  useEffect(() => {
    if (!profile?.uid) return;

    const audio = new Audio("/notification.mp3");
    audio.volume = 1.0;

    return subscribeNotifications(profile.uid, (items) => {
      items.forEach((item) => {
        if (!previous.current.has(item.id)) {
          previous.current.add(item.id);
          if (item.type === "NEW_SCHOLARSHIP") {
            audio.currentTime = 0;
            audio.play().catch(() => {});
            if (Notification.permission === "granted") {
              new Notification(item.title, { body: item.message });
            }
          }
        }
      });
    });
  }, [profile?.uid]);

  return null;
}
