import React from "react";
import { Navigate } from "react-router-dom";
import { useMenu } from "../contexts/MenuContext";
import { useAuth } from "@/contexts/AuthContext";
import { buildIdUrl, getSubdomain, DEFAULT_ORG_SLUG, isLoginSubdomain } from "@/utils/subdomain";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { loading } = useMenu();
  const { userConfig } = useAuth();
  // const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!userConfig?.userType) {
    if (isLoginSubdomain()) {
      return <Navigate to="/" replace />;
    }
    const currentSubdomain = getSubdomain();
    const orgSlug = currentSubdomain || DEFAULT_ORG_SLUG;
    const idLoginUrl = orgSlug === DEFAULT_ORG_SLUG
      ? `${buildIdUrl("/")}?logout=true`
      : `${buildIdUrl("/")}?org=${orgSlug}&logout=true`;
    window.location.href = idLoginUrl;
    return null;
  }

  if (userConfig?.userType && userConfig?.isPasswordSet === false) {
    const currentSubdomain = getSubdomain();
    if (currentSubdomain === "id") {
      return (
        <Navigate
          to="/auth/reset-password"
          state={{ isPasswordRecovery: true }}
          replace
        />
      );
    }
    const orgSlug = currentSubdomain || DEFAULT_ORG_SLUG;
    const resetPasswordUrl = orgSlug === DEFAULT_ORG_SLUG
      ? buildIdUrl("/auth/reset-password")
      : `${buildIdUrl("/auth/reset-password")}?org=${orgSlug}`;
    window.location.href = resetPasswordUrl;
    return null;
  }

  // if (!hasAccess(location.pathname)) {
  //   return <Navigate to="/" replace />
  // }

  return <>{children}</>;
};

export default ProtectedRoute;
