import { Prisma } from "@prisma/client";

export function buildOrganizationUserFilter(
    organizationId: number,
    additionalFilters?: Omit<Prisma.UserWhereInput, "organizationUsers">,
): Prisma.UserWhereInput {
    const filter: Prisma.UserWhereInput = {
        organizationUsers: {
            some: {
                organizationId,
            },
        },
        ...additionalFilters,
    };

    return filter;
}

export async function userBelongsToOrganization(
    userId: string,
    organizationId: number,
): Promise<boolean> {
    const { prisma } = await import("../lib/prisma");

    const organizationUser = await prisma.organizationUser.findUnique({
        where: {
            organizationId_userId: {
                organizationId,
                userId,
            },
        },
    });

    return organizationUser !== null;
}


class OrganizationUserHelper {
    buildFilter = buildOrganizationUserFilter;

    userBelongsToOrganization = userBelongsToOrganization;
}

const organizationUserHelper = new OrganizationUserHelper();

export default organizationUserHelper;

