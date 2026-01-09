import { Response } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode } from "../types";
import { Priority, UserType as PrismaUserType, Status, Organization, Prisma } from "@prisma/client";
import { logger } from "../helpers/logger.helper";
import { prisma } from "../lib/prisma";
import { UserService } from "../services/user.service";
import PaginationHelper from "../helpers/pagination.helper";
import {
    GetLicenseeOrganizationsSchema,
    CreateLicenseeOrganizationSchema,
    UpdateLicenseeOrganizationSchema,
    CreateLicenseeOrganizationAdminSchema,
    CreateLicenseeOrganizationDoctorSchema,
} from "../schemas";

class LicenseeController {
    public static async getOrganizations(
        req: AuthenticatedRequest & { query: GetLicenseeOrganizationsSchema },
        res: Response,
    ) {
        try {
            const { organizationId } = req.user!;
            const { page, limit, search } = req.query;

            const parsedPage = page || 1;
            const parsedLimit = limit || 10;
            const searchTerm = search?.toLowerCase().trim();

            const where: Prisma.OrganizationWhereInput = {
                parentOrganizationId: organizationId!,
            };

            if (searchTerm) {
                where.OR = [
                    { name: { contains: searchTerm, mode: "insensitive" } },
                    { slug: { contains: searchTerm, mode: "insensitive" } },
                ];
            }

            const result = await PaginationHelper.paginate<
                Organization,
                Prisma.OrganizationFindManyArgs
            >(
                prisma.organization,
                {
                    where,
                    select: {
                        uuid: true,
                        name: true,
                        slug: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        createdAt: "desc",
                    },
                },
                {
                    page: parsedPage,
                    limit: parsedLimit,
                    traceId: req.traceId,
                },
            );

            sendResponse(res, {
                status: StatusCode.OK,
                data: {
                    items: result.data,
                    pagination: result.meta,
                },
                message: "Organizations fetched successfully",
            });
        } catch (err) {
            logger.error("Get licensee organizations failed", {
                traceId: req.traceId,
                method: "getOrganizations",
                error: err,
            });
            sendResponse(
                res,
                {
                    status: StatusCode.INTERNAL_SERVER_ERROR,
                    error: err,
                    message: "Failed to get organizations",
                },
                req,
            );
        }
    }

    public static async createOrganization(
        req: AuthenticatedRequest,
        res: Response,
    ) {
        try {
            const { userId, organizationId } = req.user!;
            const { name } = req.body as CreateLicenseeOrganizationSchema;

            const existingOrg = await prisma.organization.findFirst({
                where: {
                    name,
                },
            });

            if (existingOrg) {
                return sendResponse(res, {
                    status: StatusCode.BAD_REQUEST,
                    error: true,
                    message: "Organization name already exists",
                });
            }

            const newOrganization = await prisma.organization.create({
                data: {
                    name,
                    parentOrganizationId: organizationId!,
                    createdByUserId: userId!,
                },
                select: {
                    id: true,
                    uuid: true,
                    name: true,
                    slug: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            await prisma.organizationCustomization.create({
                data: {
                    organizationId: newOrganization.id,
                },
            });

            await UserService.createUserAuditLog({
                userId: userId!,
                description: `Organization created: ${name}`,
                metadata: {
                    organizationId: newOrganization.id,
                    organizationUuid: newOrganization.uuid,
                    organizationName: name,
                    action: "create_organization",
                },
                priority: Priority.HIGH,
            });

            sendResponse(res, {
                status: StatusCode.OK,
                data: {
                    ...newOrganization,
                    id: newOrganization.uuid,
                },
                message: "Organization created successfully",
            });
        } catch (err) {
            logger.error("Create licensee organization failed", {
                traceId: req.traceId,
                method: "createOrganization",
                error: err,
            });
            sendResponse(
                res,
                {
                    status: StatusCode.INTERNAL_SERVER_ERROR,
                    error: err,
                    message: "Failed to create organization",
                },
                req,
            );
        }
    }

    public static async updateOrganization(
        req: AuthenticatedRequest,
        res: Response,
    ) {
        try {
            const { userId, organizationId: licenseeOrganizationId } = req.user!;
            const { name } = req.body as UpdateLicenseeOrganizationSchema;
            const { organizationId: organizationUuid } = req.params;

            const organization = await prisma.organization.findFirst({
                where: {
                    uuid: organizationUuid,
                    parentOrganizationId: licenseeOrganizationId!,
                },
            });

            if (!organization) {
                return sendResponse(res, {
                    status: StatusCode.FORBIDDEN,
                    error: true,
                    message: "Organization not found or does not belong to licensee",
                });
            }

            const existingOrg = await prisma.organization.findFirst({
                where: {
                    name,
                    id: {
                        not: organization.id,
                    },
                },
            });

            if (existingOrg) {
                return sendResponse(res, {
                    status: StatusCode.BAD_REQUEST,
                    error: true,
                    message: "Organization name already exists",
                });
            }

            const [updatedOrganization] = await Promise.all([
                prisma.organization.update({
                    where: {
                        id: organization.id,
                    },
                    data: {
                        name,
                    },
                    select: {
                        id: true,
                        uuid: true,
                        name: true,
                        slug: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                }),
                UserService.createUserAuditLog({
                    userId: userId!,
                    description: `Organization name updated: ${name}`,
                    metadata: {
                        organizationId: organization.id,
                        organizationUuid: organization.uuid,
                        oldName: organization.name,
                        newName: name,
                        action: "update_organization_name",
                    },
                    priority: Priority.MEDIUM,
                }),
            ]);

            sendResponse(res, {
                status: StatusCode.OK,
                data: {
                    ...updatedOrganization,
                    id: updatedOrganization.uuid,
                },
                message: "Organization updated successfully",
            });
        } catch (err) {
            logger.error("Update licensee organization failed", {
                traceId: req.traceId,
                method: "updateOrganization",
                error: err,
            });
            sendResponse(
                res,
                {
                    status: StatusCode.INTERNAL_SERVER_ERROR,
                    error: err,
                    message: "Failed to update organization",
                },
                req,
            );
        }
    }

    public static async createOrganizationAdmin(
        req: AuthenticatedRequest,
        res: Response,
    ) {
        try {
            const { userId, organizationId: licenseeOrganizationId } = req.user!;
            const {
                email,
                password,
                firstName,
                lastName,
                middleName,
                organizationId: organizationUuid,
            } = req.body as CreateLicenseeOrganizationAdminSchema;

            const organization = await prisma.organization.findFirst({
                where: {
                    uuid: organizationUuid,
                    parentOrganizationId: licenseeOrganizationId!,
                },
            });

            if (!organization) {
                return sendResponse(res, {
                    status: StatusCode.FORBIDDEN,
                    error: true,
                    message: "Organization not found or does not belong to licensee",
                });
            }

            const result = await UserService.createUser({
                email,
                password,
                firstName,
                lastName,
                middleName,
                userType: PrismaUserType.ADMIN,
                organizationId: organization.id,
                userId: userId!,
                status: Status.PENDING,
                traceId: req.traceId,
            });

            await UserService.createUserAuditLog({
                userId: userId!,
                description: "Organization admin create attempt",
                metadata: {
                    body: req.body,
                    organizationId: organization.id,
                    organizationUuid: organization.uuid,
                },
                priority: Priority.HIGH,
            });

            if (!result.success) {
                return sendResponse(res, {
                    status: StatusCode.BAD_REQUEST,
                    error: true,
                    message: result.error,
                });
            }

            sendResponse(res, {
                status: StatusCode.OK,
                data: {
                    ...req.body,
                    password: undefined,
                },
                message: "Organization admin created successfully",
            });
        } catch (err) {
            logger.error("Create licensee organization admin failed", {
                traceId: req.traceId,
                method: "createOrganizationAdmin",
                error: err,
            });
            sendResponse(
                res,
                {
                    status: StatusCode.INTERNAL_SERVER_ERROR,
                    error: err,
                    message: "Failed to create organization admin",
                },
                req,
            );
        }
    }

    public static async createOrganizationDoctor(
        req: AuthenticatedRequest,
        res: Response,
    ) {
        try {
            const { userId, organizationId: licenseeOrganizationId } = req.user!;
            const {
                email,
                password,
                firstName,
                lastName,
                middleName,
                organizationId: organizationUuid,
            } = req.body as CreateLicenseeOrganizationDoctorSchema;

            const organization = await prisma.organization.findFirst({
                where: {
                    uuid: organizationUuid,
                    parentOrganizationId: licenseeOrganizationId!,
                },
            });

            if (!organization) {
                return sendResponse(res, {
                    status: StatusCode.FORBIDDEN,
                    error: true,
                    message: "Organization not found or does not belong to licensee",
                });
            }

            const result = await UserService.createUser({
                email,
                password,
                firstName,
                lastName,
                middleName,
                userType: PrismaUserType.DOCTOR,
                organizationId: organization.id,
                userId: userId!,
                status: Status.PENDING,
                traceId: req.traceId,
            });

            await UserService.createUserAuditLog({
                userId: userId!,
                description: "Organization doctor create attempt",
                metadata: {
                    body: req.body,
                    organizationId: organization.id,
                    organizationUuid: organization.uuid,
                },
                priority: Priority.HIGH,
            });

            if (!result.success) {
                return sendResponse(res, {
                    status: StatusCode.BAD_REQUEST,
                    error: true,
                    message: result.error,
                });
            }

            sendResponse(res, {
                status: StatusCode.OK,
                data: {
                    ...req.body,
                    password: undefined,
                },
                message: "Organization doctor created successfully",
            });
        } catch (err) {
            logger.error("Create licensee organization doctor failed", {
                traceId: req.traceId,
                method: "createOrganizationDoctor",
                error: err,
            });
            sendResponse(
                res,
                {
                    status: StatusCode.INTERNAL_SERVER_ERROR,
                    error: err,
                    message: "Failed to create organization doctor",
                },
                req,
            );
        }
    }
}

export default LicenseeController;