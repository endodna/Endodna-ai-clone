import { prisma } from "../lib/prisma";
import { RESERVED_ORGANIZATION_SLUGS } from "../utils/constants";

export interface SlugValidationResult {
    valid: boolean;
    error?: string;
}

export async function validateOrganizationSlug(
    slug: string,
    excludeOrganizationId?: number
): Promise<SlugValidationResult> {
    if (!slug || slug.trim().length === 0) {
        return {
            valid: false,
            error: "Slug is required",
        };
    }

    if (slug.length < 3 || slug.length > 63) {
        return {
            valid: false,
            error: "Slug must be between 3 and 63 characters",
        };
    }

    if (RESERVED_ORGANIZATION_SLUGS.includes(slug.toLowerCase() as any)) {
        return {
            valid: false,
            error: `Slug "${slug}" is reserved and cannot be used`,
        };
    }

    if (slug.startsWith("-") || slug.endsWith("-")) {
        return {
            valid: false,
            error: "Slug cannot start or end with a hyphen",
        };
    }

    if (slug.includes("--")) {
        return {
            valid: false,
            error: "Slug cannot contain consecutive hyphens",
        };
    }

    const existingOrg = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true },
    });

    if (existingOrg && existingOrg.id !== excludeOrganizationId) {
        return {
            valid: false,
            error: `Slug "${slug}" is already taken`,
        };
    }

    return { valid: true };
}


export async function generateOrganizationSlug(
    name: string,
    excludeOrganizationId?: number
): Promise<string> {
    let slug = name.toLowerCase().trim();

    slug = slug.replace(/[\s_]+/g, "-");

    slug = slug.replace(/[^a-z0-9-]/g, "");

    slug = slug.replace(/^-+|-+$/g, "");

    slug = slug.replace(/-+/g, "-");

    if (slug.length < 3) {
        slug = `${slug}-${Math.random().toString(36).substring(2, 5)}`;
    }

    if (slug.length > 63) {
        slug = slug.substring(0, 63);
        slug = slug.replace(/-+$/, "");
    }

    const validation = await validateOrganizationSlug(slug, excludeOrganizationId);

    if (validation.valid) {
        return slug;
    }

    let candidateSlug = `${slug}`;

    const maxBaseLength = 60;
    if (slug.length > maxBaseLength) {
        slug = slug.substring(0, maxBaseLength);
        candidateSlug = `${slug}`;
    }

    const candidateValidation = await validateOrganizationSlug(
        candidateSlug,
        excludeOrganizationId
    );

    if (candidateValidation.valid) {
        return candidateSlug;
    }

    const timestamp = Date.now().toString(36);
    return `${slug.substring(0, 50)}-${timestamp}`;
}

