import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/Auth/Login";
import ResetPasswordForm from "./pages/Auth/ResetPassword";
import ForgotPasswordForm from "./pages/Auth/ForgotPassword";
import Error404 from "./pages/Error404";
import AcceptInvitation from "./pages/Auth/AcceptInvitation";
import DashboardLayout from "./Layouts/DashboardLayout";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: LoginPage,
  },
  {
    path: "/dashboard",
    Component: () => (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        Component: () => <div>Patients</div>,
      },
      {
        path: "quick-actions",
        Component: () => <div>Quick Actions</div>,
      },
      {
        path: "ai-assistant",
        Component: () => <div>AI Assistant</div>,
      },
      {
        path: "patients",
        Component: () => <div>Patients</div>,
      },
      {
        path: "care-strategy",
        Component: () => <div>Care Strategy</div>,
      },
      {
        path: "labs",
        Component: () => <div>Labs</div>,
      },
      {
        path: "automation",
        Component: () => <div>Automation</div>,
      },
      {
        path: "manage-clinic",
        Component: () => <div>Manage Clinic</div>,
      },
    ],
  },
  {
    path: "/auth",
    children: [
      {
        path: "reset-password",
        Component: () => <ResetPasswordForm />,
      },
      {
        path: "forgot-password",
        Component: () => <ForgotPasswordForm />,
      },
      {
        path: "accept-invitation",
        Component: () => <AcceptInvitation />,
      },
    ],
  },
  {
    path: "/unauthorized",
    Component: () => (
      <div className="p-8 text-center">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    ),
  },
  {
    path: "*",
    Component: () => <Error404 />,
  },
]);
