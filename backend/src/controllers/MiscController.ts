import { Response, Request } from "express";
import { sendResponse } from "../helpers/response.helper";
import { AuthenticatedRequest, StatusCode, UserType } from "../types";
import { logger } from "../helpers/logger.helper";
import { getMenu } from "../helpers/menu.helper";
import {
  ChatMessageRole,
  ChatType,
  DNAResultStatus,
  Gender,
  MedicalRecordType,
  OrderType,
  PaymentStatus,
  Priority,
  Status,
} from "@prisma/client";
import { prisma } from "../lib/prisma";
import s3Helper from "../helpers/aws/s3.helper";
import OrganizationCustomizationHelper from "../helpers/organization-customization.helper";
import { PrefilledDataField, prefilledDataFields } from "../helpers/llm/prefilledDataField";
import redis from "../lib/redis";
import { PublicOrganizationInfoSchema } from "../schemas";
import { DEFAULT_ORG_SLUG } from "../utils/constants";

class MiscController {
  public static async getMenu(req: AuthenticatedRequest, res: Response) {
    try {
      const { user } = req;
      const menu = getMenu(user?.userType as UserType);
      sendResponse(res, {
        status: StatusCode.OK,
        data: menu,
        message: "Menu fetched successfully",
      });
    } catch (err) {
      logger.error("Get menu failed", {
        traceId: req.traceId,
        method: "getMenu",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch menu",
        },
        req,
      );
    }
  }

  public static async getConstants(req: AuthenticatedRequest, res: Response) {
    try {
      const constants = {
        status: Object.values(Status),
        dnaResultStatus: Object.values(DNAResultStatus),
        medicalRecordType: Object.values(MedicalRecordType),
        priority: Object.values(Priority),
        chatType: Object.values(ChatType),
        chatMessageRole: Object.values(ChatMessageRole),
        orderType: Object.values(OrderType),
        paymentStatus: Object.values(PaymentStatus),
        gender: Object.values(Gender),
      };

      sendResponse(res, {
        status: StatusCode.OK,
        data: constants,
        message: "Constants fetched successfully",
      });
    } catch (err) {
      logger.error("Get constants failed", {
        traceId: req.traceId,
        method: "getConstants",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch constants",
        },
        req,
      );
    }
  }

  public static async getPublicOrganizationInfo(req: Request, res: Response) {
    try {
      const { slug } = req.query as PublicOrganizationInfoSchema;

      const cacheKey = `org:public:${slug}`;
      const CACHE_TTL_SECONDS = 60 * 5; // 5 minutes

      try {
        const cached = await redis.get(cacheKey);
        if (cached) {
          return sendResponse(res, {
            status: StatusCode.OK,
            data: JSON.parse(cached),
            message: "Organization info retrieved successfully",
          });
        }
      } catch (cacheError) {
        logger.warn("Cache read error", {
          traceId: (req as any).traceId,
          error: cacheError,
          method: "getPublicOrganizationInfo",
        });
      }

      let organization;

      if (slug === DEFAULT_ORG_SLUG) {
        organization = await prisma.organization.findFirst({
          where: {
            OR: [
              { slug: null },
              { slug: DEFAULT_ORG_SLUG },
            ],
          },
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            customizations: {
              select: {
                customization: true,
              },
            },
          },
          orderBy: { id: "asc" },
        });
      } else {
        organization = await prisma.organization.findUnique({
          where: { slug },
          select: {
            id: true,
            uuid: true,
            name: true,
            slug: true,
            parentOrganizationId: true,
            customizations: {
              select: {
                customization: true,
              },
            },
          },
        });

        if (organization?.parentOrganizationId) {
          organization = await prisma.organization.findUnique({
            where: { id: organization.parentOrganizationId },
            select: {
              id: true,
              uuid: true,
              name: true,
              slug: true,
              customizations: {
                select: {
                  customization: true,
                },
              },
            },
          });
        }
      }

      if (!organization) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Organization not found",
        });
      }

      const structuredCustomization = organization.customizations[0]?.customization
        ? OrganizationCustomizationHelper.structureCustomization(organization.customizations[0].customization)
        : null;

      const publicCustomization = OrganizationCustomizationHelper.getPublicCustomization(structuredCustomization);

      if (publicCustomization?.logo?.key && publicCustomization.logo.bucket) {
        try {
          const presignedUrl = await s3Helper.getPresignedDownloadUrl({
            bucket: publicCustomization.logo.bucket,
            key: publicCustomization.logo.key,
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            traceId: (req as any).traceId,
          });
          publicCustomization.logo.url = presignedUrl;
        } catch (error) {
          logger.warn("Failed to generate presigned URL for logo", {
            traceId: (req as any).traceId,
            method: "getPublicOrganizationInfo",
            error,
          });
        }
      }

      const responseData = {
        id: organization.uuid,
        name: organization.name,
        slug: organization.slug,
        customization: publicCustomization,
      };

      try {
        await redis.set(cacheKey, JSON.stringify(responseData), CACHE_TTL_SECONDS);
      } catch (cacheError) {
        logger.warn("Cache write error", {
          traceId: (req as any).traceId,
          error: cacheError,
          method: "getPublicOrganizationInfo",
        });
      }

      return sendResponse(res, {
        status: StatusCode.OK,
        data: responseData,
        message: "Organization info retrieved successfully",
      });
    } catch (err) {
      logger.error("Get public organization info failed", {
        traceId: (req as any).traceId,
        method: "getPublicOrganizationInfo",
        error: err,
      });
      sendResponse(res, {
        status: StatusCode.INTERNAL_SERVER_ERROR,
        error: err,
        message: "Failed to get organization info",
      });
    }
  }

  public static async getPrefilledPatientHealthDataFields(req: AuthenticatedRequest, res: Response) {
    try {
      const prefilledDataFieldsList = prefilledDataFields;
      const prefilledDataFieldsObject: Record<string, PrefilledDataField> = prefilledDataFieldsList.reduce((acc, field) => {
        acc[field.id] = field;
        return acc;
      }, {} as Record<string, PrefilledDataField>);

      sendResponse(res, {
        status: StatusCode.OK,
        data: prefilledDataFieldsObject,
        message: "Prefilled data fields fetched successfully",
      });

    } catch (err) {
      logger.error("Get prefilled data fields failed", {
        traceId: req.traceId,
        method: "getPrefilledDataFields",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to fetch prefilled data fields",
        },
        req,
      );
    }
  }
}

export default MiscController;
