import { Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

/**
 * Redirects unauthenticated users to the login page.
 * Uses AuthContext as the source of truth — no direct localStorage reads.
 */
function ProtectedRoute({ children }) {
  const { token } = useAuth();

  if (!token) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;