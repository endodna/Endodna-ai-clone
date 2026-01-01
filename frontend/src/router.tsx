import {
  Suspense,
  lazy,
  type ComponentType,
  type LazyExoticComponent,
} from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/Auth/Login";
import { Loading } from "./components/Loading";
import { IdSubdomainGuard, OrgSubdomainGuard } from "@/components/SubdomainGuard";
import { isLoginSubdomain } from "@/utils/subdomain";

const DashboardLayout = lazy(() => import("./Layouts/DashboardLayout"));
const ResetPasswordForm = lazy(() => import("./pages/Auth/ResetPassword"));
const ForgotPasswordForm = lazy(() => import("./pages/Auth/ForgotPassword"));
const AcceptInvitation = lazy(() => import("./pages/Auth/AcceptInvitation"));
const Transfer = lazy(() => import("./pages/Auth/Transfer"));
const PatientListPage = lazy(() => import("./pages/Patients/PatientListPage"));
const PatientProfilePage = lazy(
  () => import("./pages/Patients/PatientProfilePage")
);
const TreatmentPlanTemplatesPage = lazy(
  () => import("./pages/TreatmentPlans/TreatmentPlanTemplatesPage")
);
const AiAssistantPage = lazy(
  () => import("./pages/AiAssistant/AiAssistantPage")
);

const Error404 = lazy(() => import("./pages/Error404"));

const withSuspense =
  (Component: LazyExoticComponent<ComponentType<object>>) => () => (
    <Suspense fallback={<Loading />}>
      <Component />
    </Suspense>
  );

export const router = createBrowserRouter([
  {
    path: "/",
    Component: () => {
      if (typeof window !== "undefined" && !isLoginSubdomain()) {
        return (
          <OrgSubdomainGuard>
            <Navigate to="/dashboard" replace />
          </OrgSubdomainGuard>
        );
      }
      
      if (typeof window !== "undefined" && isLoginSubdomain()) {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.has("org")) {
          urlParams.delete("org");
          const newUrl = urlParams.toString() 
            ? `${window.location.pathname}?${urlParams.toString()}`
            : window.location.pathname;
          window.history.replaceState({}, "", newUrl);
        }
      }
      
      return (
        <IdSubdomainGuard>
          <LoginPage />
        </IdSubdomainGuard>
      );
    },
  },
  {
    path: "/dashboard",
    Component: () => (
      <OrgSubdomainGuard>
        <ProtectedRoute>
          <Suspense fallback={<Loading loadingMessage="Loading dashboard..." />}>
            <DashboardLayout />
          </Suspense>
        </ProtectedRoute>
      </OrgSubdomainGuard>
    ),
    children: [
      {
        index: true,
        Component: withSuspense(PatientListPage),
      },
      {
        path: "quick-actions",
        Component: () => <div>Quick Actions</div>,
      },
      {
        path: "ai-assistant",
        Component: withSuspense(AiAssistantPage),
      },
      {
        path: "patients",
        Component: withSuspense(PatientListPage),
      },
      {
        path: "patients/:patientId",
        Component: withSuspense(PatientProfilePage),
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
      {
        path: "treatment-plan-template",
        Component: withSuspense(TreatmentPlanTemplatesPage),
      },
    ],
  },
  {
    path: "/auth",
    children: [
      {
        path: "transfer",
        Component: () => (
          <OrgSubdomainGuard>
            <Suspense fallback={<Loading />}>
              <Transfer />
            </Suspense>
          </OrgSubdomainGuard>
        ),
      },
      {
        path: "reset-password",
        Component: () => (
          <IdSubdomainGuard>
            {withSuspense(ResetPasswordForm)()}
          </IdSubdomainGuard>
        ),
      },
      {
        path: "forgot-password",
        Component: () => (
          <IdSubdomainGuard>
            {withSuspense(ForgotPasswordForm)()}
          </IdSubdomainGuard>
        ),
      },
      {
        path: "accept-invitation",
        Component: () => (
          <IdSubdomainGuard>
            {withSuspense(AcceptInvitation)()}
          </IdSubdomainGuard>
        ),
      },
    ],
  },
  {
    path: "/unauthorized",
    Component: () => (
      <div className="p-8 text-center">
        <h1 className="typo-h3 text-red-600 mb-4">Access Denied</h1>
        <p className="text-gray-600">
          You don't have permission to access this page.
        </p>
      </div>
    ),
  },
  {
    path: "*",
    Component: withSuspense(Error404),
  },
]);
