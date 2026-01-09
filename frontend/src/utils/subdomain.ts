export const DEFAULT_ORG_SLUG = "app";
export const BASE_DOMAIN = import.meta.env.VITE_BASE_DOMAIN || "bios.med";
export const ID_SUBDOMAIN = "id";

export function getSubdomain(): string | null {
    if (typeof window === "undefined") {
        return null;
    }

    const hostname = window.location.hostname;
    const parts = hostname.split(".");

    // Handle bios.dev subdomains for local development (e.g., id.bios.dev, app.bios.dev)
    // This requires /etc/hosts configuration
    if (hostname.includes("bios.dev") && parts.length >= 3) {
        // If it's subdomain.bios.dev format, return the subdomain
        if (parts.slice(-2).join(".") === "bios.dev") {
            return parts[0];
        }
    }

    // Handle localhost fallback (if someone uses localhost without /etc/hosts)
    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return null;
    }

    // For production domains (e.g., id.bios.med, app.bios.med)
    if (parts.length >= 3) {
        return parts[0];
    }

    return null;
}

export function getBaseDomain(): string {
    if (typeof window === "undefined") {
        return BASE_DOMAIN;
    }

    const hostname = window.location.hostname;
    const parts = hostname.split(".");

    // For bios.dev subdomains (local development), return "bios.dev"
    if (hostname.includes("bios.dev") && parts.length >= 3) {
        if (parts.slice(-2).join(".") === "bios.dev") {
            return "bios.dev";
        }
    }

    // For production domains, extract base domain
    if (parts.length >= 2) {
        return parts.slice(-2).join(".");
    }

    return BASE_DOMAIN;
}

export function isLoginSubdomain(): boolean {
    const subdomain = getSubdomain();
    return subdomain === ID_SUBDOMAIN;
}

export function buildApiUrl(): string {
    return import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1";
}

export function buildOrgUrl(orgSlug: string, path: string = "/"): string {
    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : "";
    const hostname = window.location.hostname;

    if (hostname.includes("bios.dev")) {
        return `${protocol}//${orgSlug}.bios.dev${port}${path}`;
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
        return `${protocol}//${orgSlug}.bios.dev${port}${path}`;
    }

    const baseDomain = getBaseDomain();
    return `${protocol}//${orgSlug}.${baseDomain}${port}${path}`;
}

export function buildIdUrl(path: string = "/"): string {
    return buildOrgUrl(ID_SUBDOMAIN, path);
}

export function getDefaultOrgUrl(path: string = "/"): string {
    return buildOrgUrl(DEFAULT_ORG_SLUG, path);
}

export function getCurrentOrgSlug(): string | null {
    const subdomain = getSubdomain();
    if (subdomain && subdomain !== ID_SUBDOMAIN) {
        return subdomain;
    }

    if (typeof window !== "undefined") {
        const urlParams = new URLSearchParams(window.location.search);
        const orgParam = urlParams.get("org");
        if (orgParam) {
            return orgParam;
        }
    }

    return null;
}

