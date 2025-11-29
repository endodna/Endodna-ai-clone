import { Response } from "express";
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

  public static async getOrganizationInfo(req: AuthenticatedRequest, res: Response) {
    try {
      const { organizationId, userType } = req.user!;

      if (!organizationId) {
        return sendResponse(res, {
          status: StatusCode.BAD_REQUEST,
          error: true,
          message: "Organization ID not found",
        });
      }

      const [organization, customization] = await Promise.all([
        prisma.organization.findUnique({
          where: {
            id: organizationId,
          },
          select: {
            id: true,
            uuid: true,
            name: true,
          },
        }),
        prisma.organizationCustomization.findUnique({
          where: {
            organizationId: organizationId,
          },
          select: {
            id: true,
            organizationId: true,
            customization: true,
          },
        }),
      ]);

      if (!organization) {
        return sendResponse(res, {
          status: StatusCode.NOT_FOUND,
          error: true,
          message: "Organization not found",
        });
      }

      const structuredCustomization = customization?.customization
        ? OrganizationCustomizationHelper.structureCustomization(customization.customization)
        : null;

      const isAdmin = userType === UserType.ADMIN || userType === UserType.SUPER_ADMIN;

      if (structuredCustomization?.logo) {
        try {
          const presignedUrl = await s3Helper.getPresignedDownloadUrl({
            bucket: structuredCustomization.logo.bucket,
            key: structuredCustomization.logo.key,
            expiresIn: 60 * 60 * 24 * 7, // 7 days
            traceId: req.traceId,
          });
          structuredCustomization.logo.url = presignedUrl;
        } catch (error) {
          logger.warn("Failed to generate presigned URL for logo", {
            traceId: req.traceId,
            method: "getOrganizationInfo",
            error,
          });
        }
      }

      let customizationData;
      if (isAdmin) {
        customizationData = OrganizationCustomizationHelper.sanitizeForResponse(structuredCustomization);
      } else {
        customizationData = OrganizationCustomizationHelper.getPublicCustomization(structuredCustomization);
      }

      sendResponse(res, {
        status: StatusCode.OK,
        data: {
          id: organization.uuid,
          name: organization.name,
          customization: customizationData,
        },
        message: "Organization info retrieved successfully",
      });
    } catch (err) {
      logger.error("Get organization info failed", {
        traceId: req.traceId,
        method: "getOrganizationInfo",
        error: err,
      });
      sendResponse(
        res,
        {
          status: StatusCode.INTERNAL_SERVER_ERROR,
          error: err,
          message: "Failed to get organization info",
        },
        req,
      );
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
