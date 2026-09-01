import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loader from "../components/common/Loader";
export default function RequireAuth({ children }) {
    const { user, loading } = useAuth();
    const location = useLocation();
    if (loading)
        return <Loader fullPage label="Checking your account…"/>;
    if (!user)
        return <Navigate to="/login" replace state={{ from: location.pathname }}/>;
    return children;
}

