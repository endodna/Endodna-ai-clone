import { Request } from 'express';

export enum UserType {
  PATIENT = 'PATIENT',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  DOCTOR = 'DOCTOR'
}


export interface AuthenticatedRequest extends Request {
  traceId?: string;
  startTime?: number;
  user?: {
    userId: string;
    userType: UserType;
    sessionId: string;
  };
}



export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export enum Feature {
  DASHBOARD = 'dashboard',
}

export enum PermissionAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  CREATE = 'create',
}

export interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  feature: Feature;
  children?: MenuItem[];
  permission: PermissionAction;
}

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  DEBUG = 'DEBUG',
}

export interface LogContext {
  traceId?: string;
  userId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  duration?: string;
  [key: string]: any;
}

export enum StatusCode {
  OK = 200,
  CREATED = 201,
  NO_CONTENT = 204,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  INTERNAL_SERVER_ERROR = 500,
}

export enum StatusMessage {
  SUCCESSFUL = "Successful",
  CREATED_SUCCESSFULLY = "Created Successfully",
  OK = "Ok",
  INVALID_REQUEST_FORMAT = "Invalid Request Format",
  UNAUTHORIZED_ACCESS = "Unauthorized Access",
  FORBIDDEN = "Forbidden",
  RESOURCE_NOT_FOUND = "Resource Not Found",
  METHOD_NOT_ALLOWED = "Method Not Allowed",
  INTERNAL_SERVER_ERROR = "Internal Server Error",
}

export interface ResponseHeader {
  name: string;
  value: string | ((req: any) => string);
}

export interface ResponseOptions {
  status: StatusCode;
  error?: any;
  data?: Object | null;
  message?: string;
}


