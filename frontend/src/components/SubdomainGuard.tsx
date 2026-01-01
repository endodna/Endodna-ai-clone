import { ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { isLoginSubdomain, getSubdomain, buildIdUrl } from "@/utils/subdomain";
import { useSessionRedirect } from "@/hooks/useSessionRedirect";
import { Loading } from "@/components/Loading";

export function IdSubdomainGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoginSubdomain()) {
      const currentSubdomain = getSubdomain();
      if (currentSubdomain && currentSubdomain !== "id") {
        const idLoginUrl = `${buildIdUrl("/")}?org=${currentSubdomain}`;
        window.location.href = idLoginUrl;
      }
    }
  }, [navigate]);

  return <>{children}</>;
}

export function OrgSubdomainGuard({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { redirecting } = useSessionRedirect();
  const hasRedirected = useRef(false);
  const redirectCheckDone = useRef(false);

  useEffect(() => {
    if (redirecting || !redirectCheckDone.current) {
      return;
    }

    if (hasRedirected.current) return;

    if (isLoginSubdomain()) {
      hasRedirected.current = true;
      window.location.replace(buildIdUrl("/"));
    }
  }, [navigate, redirecting]);

  useEffect(() => {
    if (!redirecting) {
      redirectCheckDone.current = true;
    }
  }, [redirecting]);

  if (redirecting) {
    return <Loading />;
  }

  return <>{children}</>;
}

