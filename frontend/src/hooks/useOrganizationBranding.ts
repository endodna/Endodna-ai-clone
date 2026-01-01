import { useState, useEffect } from "react";
import { miscApi } from "../handlers/api/api";
import { getCurrentOrgSlug, isLoginSubdomain } from "../utils/subdomain";

export interface OrganizationBranding {
    id: string;
    name: string;
    slug: string;
    customization?: {
        logo?: {
            url?: string;
        };
        primaryColor?: string;
        secondaryColor?: string;
        tagline?: string;
    };
}

export function useOrganizationBranding(
    orgSlugOverride?: string | null,
    inviteContext?: { organization?: { slug?: string } }
): {
    branding: OrganizationBranding | null;
    loading: boolean;
    error: string | null;
} {
    const [branding, setBranding] = useState<OrganizationBranding | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchBranding = async () => {
            setLoading(true);
            setError(null);

            try {
                let slug: string | null = null;

                if (orgSlugOverride) {
                    slug = orgSlugOverride;
                } else if (inviteContext?.organization?.slug) {
                    slug = inviteContext.organization.slug;
                } else {
                    slug = getCurrentOrgSlug();

                    if (!slug && isLoginSubdomain()) {
                        const urlParams = new URLSearchParams(window.location.search);
                        slug = urlParams.get("org");
                    }
                }

                if (!slug) {
                    if (isMounted) {
                        setBranding(null);
                        setLoading(false);
                    }
                    return;
                }

                const response = await miscApi.getPublicOrganization(slug);

                if (isMounted) {
                    if (response.error || !response.data) {
                        setError(response.message || "Failed to fetch organization branding");
                        setBranding(null);
                    } else {
                        setBranding(response.data as OrganizationBranding);
                        setError(null);
                    }
                    setLoading(false);
                }
            } catch (err: any) {
                if (isMounted) {
                    setError(err.message || "Failed to fetch organization branding");
                    setBranding(null);
                    setLoading(false);
                }
            }
        };

        fetchBranding();

        return () => {
            isMounted = false;
        };
    }, [orgSlugOverride, inviteContext]);

    return { branding, loading, error };
}

