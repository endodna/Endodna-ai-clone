export interface OrganizationCustomizationData {
    logo?: {
        url: string;
        key: string;
        bucket: string;
        uploadedAt: string;
    };
    primaryColor?: string;
    secondaryColor?: string;
    theme?: "light" | "dark" | "auto";
    branding?: {
        companyName?: string;
        tagline?: string;
        website?: string;
    };
    email?: {
        fromName?: string;
        fromEmail?: string;
        replyTo?: string;
    };
    features?: {
        [key: string]: boolean | string | number;
    };
}

export interface PublicOrganizationCustomizationData {
    logo?: {
        url: string;
        key?: string;
        bucket?: string;
        uploadedAt?: string;
    };
    primaryColor?: string;
    secondaryColor?: string;
    theme?: "light" | "dark" | "auto";
    branding?: {
        companyName?: string;
        tagline?: string;
        website?: string;
    };
}

export interface SanitizedOrganizationCustomizationData {
    logo?: {
        url: string;
        uploadedAt: string;
    };
    primaryColor?: string;
    secondaryColor?: string;
    theme?: "light" | "dark" | "auto";
    branding?: {
        companyName?: string;
        tagline?: string;
        website?: string;
    };
    email?: {
        fromName?: string;
        fromEmail?: string;
        replyTo?: string;
    };
    features?: {
        [key: string]: boolean | string | number;
    };
}

export class OrganizationCustomizationHelper {
    static structureCustomization(customization: any): OrganizationCustomizationData {
        if (!customization || typeof customization !== "object") {
            return {};
        }

        return {
            logo: customization.logo || undefined,
            primaryColor: customization.primaryColor || undefined,
            secondaryColor: customization.secondaryColor || undefined,
            theme: customization.theme || undefined,
            branding: customization.branding || undefined,
            email: customization.email || undefined,
            features: customization.features || undefined,
        };
    }

    static mergeCustomization(
        existing: OrganizationCustomizationData | null,
        updates: Partial<OrganizationCustomizationData>,
    ): OrganizationCustomizationData {
        const existingData = existing || {};
        return {
            ...existingData,
            ...updates,
            branding: {
                ...existingData.branding,
                ...updates.branding,
            },
            email: {
                ...existingData.email,
                ...updates.email,
            },
            features: {
                ...existingData.features,
                ...updates.features,
            },
        };
    }


    static validateCustomization(customization: Partial<OrganizationCustomizationData>): {
        valid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (customization.primaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customization.primaryColor)) {
            errors.push("Primary color must be a valid hex color code");
        }

        if (customization.secondaryColor && !/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(customization.secondaryColor)) {
            errors.push("Secondary color must be a valid hex color code");
        }

        if (customization.theme && !["light", "dark", "auto"].includes(customization.theme)) {
            errors.push("Theme must be one of: light, dark, auto");
        }

        if (customization.email?.fromEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customization.email.fromEmail)) {
            errors.push("Email fromEmail must be a valid email address");
        }

        if (customization.email?.replyTo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customization.email.replyTo)) {
            errors.push("Email replyTo must be a valid email address");
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    static createLogoCustomization(
        uploadResult: { key: string; bucket: string; location: string },
    ): OrganizationCustomizationData["logo"] {
        return {
            url: uploadResult.location,
            key: uploadResult.key,
            bucket: uploadResult.bucket,
            uploadedAt: new Date().toISOString(),
        };
    }

    static getPublicCustomization(
        customization: OrganizationCustomizationData | null,
    ): PublicOrganizationCustomizationData | null {
        if (!customization) {
            return null;
        }

        const publicData: PublicOrganizationCustomizationData = {};

        if (customization.logo) {
            publicData.logo = {
                url: customization.logo.url,
            };
        }

        if (customization.primaryColor !== undefined) {
            publicData.primaryColor = customization.primaryColor;
        }

        if (customization.secondaryColor !== undefined) {
            publicData.secondaryColor = customization.secondaryColor;
        }

        if (customization.theme !== undefined) {
            publicData.theme = customization.theme;
        }

        if (customization.branding !== undefined) {
            publicData.branding = customization.branding;
        }

        return Object.keys(publicData).length > 0 ? publicData : null;
    }

    static sanitizeForResponse(
        customization: OrganizationCustomizationData | null,
    ): SanitizedOrganizationCustomizationData | null {
        if (!customization) {
            return null;
        }

        const sanitized: SanitizedOrganizationCustomizationData = {
            primaryColor: customization.primaryColor,
            secondaryColor: customization.secondaryColor,
            theme: customization.theme,
            branding: customization.branding,
            email: customization.email,
            features: customization.features,
        };

        if (customization.logo) {
            sanitized.logo = {
                url: customization.logo.url,
                uploadedAt: customization.logo.uploadedAt,
            };
        }

        return sanitized;
    }
}

export default OrganizationCustomizationHelper;

