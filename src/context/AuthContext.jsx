import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { onAuthStateChanged } from "firebase/auth";
import { onValue, ref } from "firebase/database";
import { auth, db } from "../config/firebase";
import {
  ensureUserProfile,
  getUserProfile,
  login as loginService,
  logout as logoutService,
  registerStudent as registerStudentService,
} from "../services/auth.service";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const profileUnsubscribeRef = useRef(null);

  const stopProfileListener = useCallback(() => {
    if (typeof profileUnsubscribeRef.current === "function") {
      profileUnsubscribeRef.current();
    }
    profileUnsubscribeRef.current = null;
  }, []);

  const watchProfile = useCallback(
    (firebaseUser) => {
      stopProfileListener();

      if (!firebaseUser?.uid) {
        setProfile(null);
        return;
      }

      const profileRef = ref(db, `users/${firebaseUser.uid}`);
      let recoveryAttempted = false;

      profileUnsubscribeRef.current = onValue(
        profileRef,
        async (snapshot) => {
          if (snapshot.exists()) {
            const nextProfile = snapshot.val();
            setProfile({ ...nextProfile, uid: nextProfile.uid || firebaseUser.uid });
            setLoading(false);
            return;
          }

          // Existing Firebase Authentication account but no RTDB profile.
          // Recover it once as a student account. Admin roles must still be
          // assigned explicitly in RTDB/Firebase Console.
          if (!recoveryAttempted) {
            recoveryAttempted = true;
            try {
              const recovered = await ensureUserProfile(firebaseUser);
              setProfile(recovered);
            } catch (error) {
              console.error("Unable to recover user profile", error);
              setProfile(null);
              setLoading(false);
            }
          } else {
            setProfile(null);
            setLoading(false);
          }
        },
        (error) => {
          console.error("Unable to subscribe to user profile", error);
          setProfile(null);
          setLoading(false);
        },
      );
    },
    [stopProfileListener],
  );

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);

      if (!nextUser) {
        stopProfileListener();
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      watchProfile(nextUser);
    });

    return () => {
      unsubscribeAuth();
      stopProfileListener();
    };
  }, [stopProfileListener, watchProfile]);

  const refreshProfile = useCallback(async () => {
    if (!auth.currentUser) {
      setProfile(null);
      return null;
    }

    const nextProfile = await getUserProfile(auth.currentUser.uid);
    setProfile(
      nextProfile
        ? { ...nextProfile, uid: nextProfile.uid || auth.currentUser.uid }
        : null,
    );
    return nextProfile;
  }, []);

  /**
   * Context-owned sign in updates user/profile immediately, before routing.
   * The realtime profile listener remains the long-term source of truth.
   */
  const signIn = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const session = await loginService(email, password);
      setUser(session.user);
      setProfile(session.profile);
      return session;
    } catch (error) {
      setUser(auth.currentUser || null);
      if (!auth.currentUser) setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const registerStudent = useCallback(async (values) => {
    setLoading(true);
    try {
      const session = await registerStudentService(values);
      setUser(session.user);
      setProfile(session.profile);
      return session;
    } catch (error) {
      setUser(auth.currentUser || null);
      if (!auth.currentUser) setProfile(null);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    setLoading(true);
    try {
      await logoutService();
      stopProfileListener();
      setUser(null);
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [stopProfileListener]);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      refreshProfile,
      signIn,
      registerStudent,
      signOut: signOutUser,
      isAdmin: profile?.role === "admin",
      isStudent: profile?.role === "student",
    }),
    [
      user,
      profile,
      loading,
      refreshProfile,
      signIn,
      registerStudent,
      signOutUser,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
