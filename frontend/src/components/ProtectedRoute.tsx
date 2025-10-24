import React from "react";
import { Navigate } from "react-router-dom";
import { useMenu } from "../contexts/MenuContext";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { loading } = useMenu();
  const { userConfig, user } = useAuth();
  // const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userConfig?.userType) {
    return <Navigate to="/" replace />;
  }
  console.log(userConfig, user);

  if (userConfig?.userType && userConfig?.isPasswordSet === false) {
    return <Navigate to="/auth/reset-password" state={{ isPasswordRecovery: true }} replace />;
  }

  // if (!hasAccess(location.pathname)) {
  //   return <Navigate to="/" replace />
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
