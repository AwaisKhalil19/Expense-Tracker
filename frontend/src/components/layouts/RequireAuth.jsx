import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/useAuth";

export default function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  return user ? (children || <Outlet/>) : <Navigate to="/login" replace state={{ from: location.pathname }}/>;
}
