import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute() {
  const {
    isAuthenticated,
    loading,
  } = useAuth();

  const location = useLocation();

  // =====================================================
  // WAIT FOR AUTH SESSION RESTORATION
  // =====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F5EF]">

        <div className="flex flex-col items-center gap-3">

          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#D9E1D6] border-t-[#285C38]" />

          <p className="text-sm font-medium text-[#748078]">
            Loading...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // USER NOT LOGGED IN
  // =====================================================

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{
          from: location,
        }}
      />
    );
  }

  // =====================================================
  // USER IS LOGGED IN
  // =====================================================

  return <Outlet />;
}

export default ProtectedRoute;