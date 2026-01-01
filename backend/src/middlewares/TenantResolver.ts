import { Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { sendResponse } from "../helpers/response.helper";
import { logger } from "../helpers/logger.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { DEFAULT_ORG_SLUG, RESERVED_ORGANIZATION_SLUGS, SESSION_KEY } from "../utils/constants";
import { getSupabaseClaims } from "../helpers/encryption.helper";
import { decryptSessionData } from "../helpers/encryption.helper";
import redis from "../lib/redis";

function extractSubdomain(hostname: string): string | null {
    const hostWithoutPort = hostname.split(":")[0];

    const parts = hostWithoutPort.split(".");

    if (parts.length >= 3) {
        return parts[0];
    }

    if (hostWithoutPort === "localhost") {
        return null;
    }

    return null;
}

export const TenantResolver = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
) => {
    try {
        if (
            req.path === "/health" ||
            req.path.startsWith("/webhook") ||
            req.path.startsWith("/webhooks") ||
            req.path.includes("/service") ||
            req.path.includes("/exchange-transfer-code")
        ) {
            return next();
        }

        const hostname = req.get("host") || req.hostname || "";
        let orgSlug: string | null = null;

        const subdomain = extractSubdomain(hostname);

        if (subdomain === "id") {
            return next();
        }

        if (!subdomain && (hostname.includes("localhost") || hostname.includes("127.0.0.1") || hostname.includes("bios.dev"))) {
            orgSlug = req.get("X-Org-Slug") || null;

            if (!orgSlug) {
                return next();
            }
        } else if (subdomain) {
            orgSlug = subdomain;
        }

        if (!orgSlug) {
            return next();
        }

        if (RESERVED_ORGANIZATION_SLUGS.includes(orgSlug.toLowerCase() as any)) {
            logger.warn("Attempted access to reserved slug", {
                traceId: req.traceId,
                slug: orgSlug,
                hostname,
            });

            return sendResponse(res, {
                status: StatusCode.NOT_FOUND,
                error: true,
                message: "OrganizationNotFound1",
            });
        }

        let organization;

        let organizationIdFromToken: number | null = null;

        const token = req.token || (req.headers.authorization && req.headers.authorization.split(" ").length === 2 ? req.headers.authorization.split(" ")[1] : null);

        if (token) {
            try {
                let claims = req.claims;
                if (!claims) {
                    claims = await getSupabaseClaims(token);
                }

                const sessionId = claims?.claims?.session_id;

                if (sessionId) {
                    if (req.user?.organizationId) {
                        organizationIdFromToken = req.user.organizationId;
                    } else {
                        const encryptedSession = await redis.get(SESSION_KEY(sessionId));
                        if (encryptedSession) {
                            const decryptedSession = decryptSessionData(encryptedSession);
                            const sessionData = JSON.parse(decryptedSession);
                            organizationIdFromToken = sessionData.organizationId || null;
                        }
                    }
                }
            } catch (tokenError) {
                logger.debug("Failed to extract organizationId from token in TenantResolver", {
                    traceId: req.traceId,
                    error: tokenError,
                });
            }
        }

        if (organizationIdFromToken) {
            organization = await prisma.organization.findUnique({
                where: { id: organizationIdFromToken },
                select: {
                    id: true,
                    slug: true,
                    name: true,
                    parentOrganization: {
                        select: {
                            id: true,
                            slug: true,
                        },
                    },
                },
            });
        }

        if (!organization) {
            if (orgSlug === DEFAULT_ORG_SLUG) {
                organization = await prisma.organization.findFirst({
                    where: {
                        OR: [
                            { slug: null },
                            { slug: DEFAULT_ORG_SLUG },
                        ],
                    },
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        parentOrganization: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                    orderBy: { id: "asc" },
                });
            } else {
                organization = await prisma.organization.findUnique({
                    where: { slug: orgSlug },
                    select: {
                        id: true,
                        slug: true,
                        name: true,
                        parentOrganization: {
                            select: {
                                id: true,
                                slug: true,
                            },
                        },
                    },
                });
            }
        }

        if (!organization) {
            logger.warn("Organization not found", {
                traceId: req.traceId,
                slug: orgSlug,
                hostname,
            });

            return sendResponse(res, {
                status: StatusCode.NOT_FOUND,
                error: true,
                message: "OrganizationNotFound2",
            });
        }

        logger.debug("Organization resolved", {
            traceId: req.traceId,
            organizationId: organization.id,
            slug: organization.slug,
            hostname,
        });

        next();
    } catch (error: any) {
        logger.error("TenantResolver error", {
            traceId: req.traceId,
            error: error.message,
            stack: error.stack,
        });

        return sendResponse(res, {
            status: StatusCode.INTERNAL_SERVER_ERROR,
            error: true,
            message: "Internal server error",
        });
    }
};

