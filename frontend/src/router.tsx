import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/Auth/Login";
import DashboardLayout from "@/Layouts/DashboardLayout";
import ResetPasswordForm from "./pages/Auth/ResetPassword";
import ForgotPasswordForm from "./pages/Auth/ForgotPassword";

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
        Component: () => <div>Dashboard</div>,
      },
      {
        path: "doctor",
        Component: () => <div>Doctor Dashboard</div>,
      },
      {
        path: "patients",
        Component: () => <div>Patients</div>,
      },
      {
        path: "settings",
        Component: () => <div>Settings</div>,
      },
    ],
  },
  {
    path: "/auth",
    children: [
      {
        path: "callback",
        Component: () => <div>Callback</div>,
      },
      {
        path: "reset-password",
        Component: () => <ResetPasswordForm />,
      },
      {
        path: "forgot-password",
        Component: () => <ForgotPasswordForm />,
      },
      {
        path: "signup",
        Component: () => <div>Signup</div>,
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
    Component: () => (
      <div className="p-8">
        <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
      </div>
    ),
  },
]);
