import { z } from "zod";
import { ReusableForm, FormField } from "@/components/forms";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthContainer from "@/components/auth/AuthContainer";
import { useOrganizationBranding } from "@/hooks/useOrganizationBranding";
import { isLoginSubdomain, buildOrgUrl, DEFAULT_ORG_SLUG, getSubdomain, buildIdUrl } from "@/utils/subdomain";
import { authApi } from "@/handlers/api/api";
import { submitTransferForm } from "@/utils/authTransfer";
import { Loading } from "@/components/Loading";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.email(
    "Please enter a valid email format (e.g. yourname@example.com)",
  ),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const loginFormFields: FormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email",
    placeholder: "user@mail.com",
    required: true,
  },
  {
    name: "password",
    type: "password",
    label: "Password",
    placeholder: "Enter your password",
    required: true,
  },
];

export default function LoginForm() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { branding, loading: brandingLoading } = useOrganizationBranding();
  const [searchParams, setSearchParams] = useSearchParams();
  const hasHandledLogout = useRef(false);

  const defaultValues = {
    email: "",
    password: "",
  };

  const [fields, setFields] = useState(loginFormFields);
  const [isLoading, setIsLoading] = useState(false);
  const [validatingSession, setValidatingSession] = useState(false);
  const hasValidatedSession = useRef(false);

  useEffect(() => {
    if (hasHandledLogout.current) return;
    
    if (isLoginSubdomain() && searchParams.get("logout") === "true") {
      hasHandledLogout.current = true;
      
      const performLogout = async () => {
        try {
          await auth.signOut();
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("logout");
          setSearchParams(newSearchParams, { replace: true });
        } catch (error) {
          console.error("Error during logout:", error);
          const newSearchParams = new URLSearchParams(searchParams);
          newSearchParams.delete("logout");
          setSearchParams(newSearchParams, { replace: true });
        }
      };
      
      performLogout();
    }
  }, [searchParams, auth, setSearchParams]);

  useEffect(() => {
    if (!isLoginSubdomain() || hasValidatedSession.current || hasHandledLogout.current) {
      return;
    }

    const validateSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.access_token && session?.refresh_token) {
          hasValidatedSession.current = true;
          setValidatingSession(true);

          const loginResponse = await authApi.login(session.access_token, session.refresh_token);

          if (loginResponse.error || !loginResponse.data) {
            console.warn("Session validation failed:", loginResponse.message);
            await supabase.auth.signOut();
            setValidatingSession(false);
            return;
          }

          const orgResponse = await authApi.getOrganization();
          
          if (orgResponse.error || !orgResponse.data) {
            console.error("Failed to get organization:", orgResponse.message);
            await supabase.auth.signOut();
            setValidatingSession(false);
            return;
          }

          const orgSlug = orgResponse.data.slug || DEFAULT_ORG_SLUG;

          try {
            const transferResponse = await authApi.createTransferCode();

            if (transferResponse.error || !transferResponse.data) {
              console.error("Failed to create transfer code:", transferResponse.message);
              window.location.href = buildOrgUrl(orgSlug, "/dashboard");
              return;
            }

            const { code, state } = transferResponse.data;
            const targetUrl = buildOrgUrl(orgSlug, "");
            submitTransferForm(code, state, targetUrl);
          } catch (err: any) {
            console.error("Transfer code creation error:", err);
            window.location.href = buildOrgUrl(orgSlug, "/dashboard");
          }
        } else {
          setValidatingSession(false);
        }
      } catch (error: any) {
        console.error("Session validation error:", error);
        setValidatingSession(false);
      }
    };

    validateSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  const handleApiError = (fieldName: string, errorMessage: string) => {
    setFields((prevFields) =>
      prevFields.map((field) =>
        field.name === fieldName
          ? { ...field, customError: errorMessage }
          : field,
      ),
    );
  };

  const handleClearAllCustomErrors = () => {
    setFields((prevFields) =>
      prevFields.map((field) => ({
        ...field,
        customError: undefined,
      })),
    );
  };

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setIsLoading(true);
    const { error, data: response } = await auth.signIn({
      email: data.email,
      password: data.password,
    });
    

    if (error) {
      handleApiError("password", error);
      setIsLoading(false);
      return;
    }

    if (response.user?.id) {
      if (isLoginSubdomain()) {
        try {
          const transferResponse = await authApi.createTransferCode();

          if (transferResponse.error || !transferResponse.data) {
            console.error("Failed to create transfer code:", transferResponse.message);
            const orgSlug = response.organizationSlug;
            if (orgSlug) {
              setIsLoading(false);
              window.location.href = buildOrgUrl(orgSlug, "/dashboard");
            } else {
              setIsLoading(false);
              navigate("/dashboard");
            }
            return;
          }

          const { code, state, organizationSlug } = transferResponse.data;
          let orgSlug = organizationSlug;

          if (!orgSlug) {
            orgSlug = DEFAULT_ORG_SLUG;
          }
       
          const targetUrl = buildOrgUrl(orgSlug, "");
          submitTransferForm(code, state, targetUrl);
        } catch (err: any) {
          console.error("Transfer code creation error:", err);
          const currentSubdomain = getSubdomain();
          const orgSlug = currentSubdomain || DEFAULT_ORG_SLUG;
          const idLoginUrl = orgSlug === DEFAULT_ORG_SLUG
            ? `${buildIdUrl("/")}?logout=true`
            : `${buildIdUrl("/")}?org=${orgSlug}&logout=true`;
          window.location.href = idLoginUrl;
        }
      } else {
        setIsLoading(false);
        navigate("/dashboard");
      }
    }
  };

  if (brandingLoading || validatingSession) {
    return (
      <AuthContainer
        header={<></>}
        organizationBranding={branding}
        organizationName={branding?.name}
      >
        <Loading />
      </AuthContainer>
    );
  }

  return (
    <AuthContainer
      header={
        <div>
          <div className=" pt-4 text-neutral-700-old ">
            Welcome Back
          </div>
          {/* <div className="text-xs text-neutral-700-old">
            <span>
              Don't have an account?
              <a href="#" className="ml-1 text-violet-500">
                Create an account
              </a>
            </span>
          </div> */}
        </div>
      }
      organizationBranding={branding}
      organizationName={branding?.name}
    >
      <div>
        <ReusableForm
          defaultValues={defaultValues}
          schema={loginSchema}
          fields={fields}
          onSubmit={handleLogin}
          submitText="Login"
          showReset={false}
          isLoading={isLoading}
          onClearAllCustomErrors={handleClearAllCustomErrors}
        />
        <div className="text-xs text-neutral-700-old mt-4">
          <span>Forgot your login details?</span>{" "}
          <Link to={"/auth/forgot-password"} className="text-violet-600">
            Reset password
          </Link>
        </div>
      </div>
    </AuthContainer>
  );
}
