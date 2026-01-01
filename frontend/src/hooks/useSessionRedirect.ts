import { useEffect, useState, useRef } from "react";
import { authApi } from "@/handlers/api/api";
import { buildIdUrl, buildOrgUrl, getDefaultOrgUrl, isLoginSubdomain, getSubdomain } from "@/utils/subdomain";
import { useAuth } from "@/contexts/AuthContext";

export interface UseSessionRedirectResult {
    redirecting: boolean;
}

export function useSessionRedirect(): UseSessionRedirectResult {
    const { signOut, userConfig } = useAuth();
    const [redirecting, setRedirecting] = useState(true);
    const hasProcessed = useRef(false);
    const redirectInProgress = useRef(false);

    useEffect(() => {
        if (hasProcessed.current || redirectInProgress.current) {
            return;
        }

        const checkSessionAndRedirect = async () => {
            if (isLoginSubdomain()) {
                setRedirecting(false);
                hasProcessed.current = true;
                return;
            }

            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.get("logout") === "true") {
                setRedirecting(false);
                hasProcessed.current = true;
                return;
            }

            try {
                if (userConfig?.userType) {
                    try {
                        const response = await authApi.getOrganization();

                        if (response.error || !response.data) {
                            console.warn("Failed to get organization or invalid session", response.message);
                            await signOut();

                            const orgParam = urlParams.get("org");
                            if (orgParam) {
                                setRedirecting(false);
                                hasProcessed.current = true;
                                return;
                            }

                            redirectInProgress.current = true;
                            window.location.href = buildIdUrl("/?logout=true");
                            return;
                        }
                        setRedirecting(false);

                        const { slug } = response.data;
                        const currentSubdomain = getSubdomain();
                        const currentPath = window.location.pathname;

                        if (slug === currentSubdomain && (currentPath === "/dashboard" || currentPath === "/")) {
                            hasProcessed.current = true;
                            return;
                        }

                        redirectInProgress.current = true;

                        if (!slug) {
                            window.location.href = getDefaultOrgUrl("/dashboard");
                            return;
                        }

                        if (slug !== currentSubdomain || (currentPath !== "/dashboard" && currentPath !== "/")) {
                            window.location.href = buildOrgUrl(slug, "/dashboard");
                            return;
                        }

                        hasProcessed.current = true;
                    } catch (error: any) {
                        console.error("Error fetching organization:", error);

                        try {
                            await signOut(true);
                        } catch (signOutError) {
                            console.error("Error signing out:", signOutError);
                        }

                        redirectInProgress.current = true;
                        window.location.href = getDefaultOrgUrl("/");
                        return;
                    }
                } else {
                    setRedirecting(false);
                    hasProcessed.current = true;
                }
            } catch (error: any) {
                console.error("Session redirect error:", error);
                setRedirecting(false);
                hasProcessed.current = true;
            }
        };

        checkSessionAndRedirect();
    }, [signOut, userConfig?.userType]);

    return { redirecting };
}

