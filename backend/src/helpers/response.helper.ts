import { Response } from "express";
import { ResponseHeader, ResponseOptions, StatusCode, StatusMessage } from "../types";

class ResponseHelper {
  private responseHeaders: ResponseHeader[] = [
    {
      name: 'X-Trace-ID',
      value: (req: any) => req.traceId || ''
    },
    {
      name: 'X-Request-ID',
      value: (req: any) => req.traceId || ''
    },
    {
      name: 'Content-Type',
      value: 'application/json'
    },
    {
      name: 'X-Content-Type-Options',
      value: 'nosniff'
    },
    {
      name: 'X-Frame-Options',
      value: 'DENY'
    },
    {
      name: 'X-XSS-Protection',
      value: '1; mode=block'
    }
  ];

  addResponseHeader(header: ResponseHeader): void {
    this.responseHeaders.push(header);
  }

  removeResponseHeader(headerName: string): void {
    this.responseHeaders = this.responseHeaders.filter(h => h.name !== headerName);
  }

  setResponseHeader(headerName: string, value: string | ((req: any) => string)): void {
    const existingIndex = this.responseHeaders.findIndex(h => h.name === headerName);
    if (existingIndex >= 0) {
      this.responseHeaders[existingIndex].value = value;
    } else {
      this.responseHeaders.push({ name: headerName, value });
    }
  }

  getResponseHeaders(req: any): Record<string, string> {
    const headers: Record<string, string> = {};

    this.responseHeaders.forEach(header => {
      const value = typeof header.value === 'function'
        ? header.value(req)
        : header.value;

      if (value) {
        headers[header.name] = value;
      }
    });

    return headers;
  }

  getAllHeaders(): ResponseHeader[] {
    return [...this.responseHeaders];
  }

  clearAllHeaders(): void {
    this.responseHeaders = [];
  }
}

export const responseHelper = new ResponseHelper();

export const sendResponse = (
  res: Response,
  options: ResponseOptions,
  req?: any
): Response => {
  const { status, error , data = null, message = "" } = options;
  const statusMessages: Record<StatusCode, string> = {
    [StatusCode.OK]: StatusMessage.SUCCESSFUL,
    [StatusCode.CREATED]: StatusMessage.CREATED_SUCCESSFULLY,
    [StatusCode.NO_CONTENT]: StatusMessage.OK,
    [StatusCode.BAD_REQUEST]: StatusMessage.INVALID_REQUEST_FORMAT,
    [StatusCode.UNAUTHORIZED]: StatusMessage.UNAUTHORIZED_ACCESS,
    [StatusCode.FORBIDDEN]: StatusMessage.FORBIDDEN,
    [StatusCode.NOT_FOUND]: StatusMessage.RESOURCE_NOT_FOUND,
    [StatusCode.METHOD_NOT_ALLOWED]: StatusMessage.METHOD_NOT_ALLOWED,
    [StatusCode.INTERNAL_SERVER_ERROR]: StatusMessage.INTERNAL_SERVER_ERROR,
  };

  let response = { data, error, message };
  if (process.env.NODE_ENV === "production" && error) {
    response.error = true;
  }
  else {
    response.error = error ? String(error) : false;
  }
  response.message = message ? message : statusMessages[status];

  const headers = responseHelper.getResponseHeaders(req || {});
  Object.entries(headers).forEach(([name, value]) => {
    res.set(name, value);
  });

  return res.status(status).json(response);
};
