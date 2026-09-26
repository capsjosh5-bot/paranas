import { useEffect, useRef } from "react";
import { db } from "../../config/firebase";
import { ref, onChildAdded } from "firebase/database";

export default function NotificationSoundListener({ uid }) {
  const audioRef = useRef(null);

  useEffect(() => {
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 1.0;

    const unlock = () => {
      if (!audioRef.current) return;
      audioRef.current.play().then(() => {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        console.log("Notification audio unlocked");
      }).catch(() => {});
    };

    window.addEventListener("click", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });

    return () => {
      window.removeEventListener("click", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  useEffect(() => {
    if (!uid) return;

    const notificationRef = ref(db, `notifications/${uid}`);

    const unsubscribe = onChildAdded(notificationRef, (snapshot) => {
      console.log("NEW SCHOLAR NOTIFICATION", snapshot.val());

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play()
          .then(() => console.log("Notification sound played"))
          .catch((e) => console.log("Sound blocked", e));
      }
    });

    return () => unsubscribe();
  }, [uid]);

  return null;
}
