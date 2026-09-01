import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/common/Loader";

export default function RequireRole({ role, children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Never redirect while Firebase/AuthContext is still resolving the profile.
  // This is critical immediately after sign-in and registration.
  if (loading) {
    return <Loader fullPage label="Loading your scholarship workspace…" />;
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (!profile) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location.pathname,
          accountError: "profile-missing",
        }}
      />
    );
  }

  const currentRole = profile.role === "admin" ? "admin" : "student";

  if (currentRole !== role) {
    return (
      <Navigate
        to={currentRole === "admin" ? "/admin" : "/student"}
        replace
      />
    );
  }

  return children;
}
