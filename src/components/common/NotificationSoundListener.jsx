import { useEffect, useRef } from "react";
import { database } from "../../firebase";
import { ref, onChildAdded } from "firebase/database";

export default function NotificationSoundListener({ uid }) {
  const audioRef = useRef(null);
  const unlocked = useRef(false);

  useEffect(() => {

    // Load sound
    audioRef.current = new Audio("/notification.mp3");
    audioRef.current.volume = 1.0;

    // Unlock browser audio
    const unlockAudio = () => {
      if (!unlocked.current) {
        audioRef.current.play()
          .then(() => {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            unlocked.current = true;
            console.log("Audio unlocked");
          })
          .catch(err => {
            console.log("Audio unlock failed", err);
          });
      }
    };

    document.addEventListener("click", unlockAudio);
    document.addEventListener("keydown", unlockAudio);

    return () => {
      document.removeEventListener("click", unlockAudio);
      document.removeEventListener("keydown", unlockAudio);
    };

  }, []);


  useEffect(() => {

    if (!uid) return;


    const notificationRef = ref(
      database,
      `notifications/${uid}`
    );


    const unsubscribe = onChildAdded(
      notificationRef,
      (snapshot) => {

        const data = snapshot.val();

        console.log(
          "NEW NOTIFICATION:",
          data
        );


        if (audioRef.current) {

          audioRef.current.currentTime = 0;

          audioRef.current.play()
            .then(() => {
              console.log(
                "Notification sound played"
              );
            })
            .catch(err => {
              console.error(
                "Sound blocked:",
                err
              );
            });

        }


      }
    );


    return () => unsubscribe();

  }, [uid]);


  return null;
}