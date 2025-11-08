const SENSITIVE_FIELDS = [
  "password",
  "passwordConfirm",
  "confirmPassword",
  "oldPassword",
  "newPassword",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "apikey",
  "secret",
  "authorization",
  "Authorization",
  "cookie",
  "Cookie",
];

const MASKED_VALUE = "***REDACTED***";

function sanitizeObject(obj: any, depth: number = 0): any {
  if (depth > 10) {
    return "[Max depth reached]";
  }

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item, depth + 1));
  }

  if (typeof obj === "object") {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      const isSensitive = SENSITIVE_FIELDS.some((field) =>
        lowerKey.includes(field.toLowerCase()),
      );

      if (isSensitive) {
        sanitized[key] = MASKED_VALUE;
      } else if (typeof value === "object" && value !== null) {
        sanitized[key] = sanitizeObject(value, depth + 1);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  return obj;
}

export function sanitizeForLogging(data: any): any {
  return sanitizeObject(data);
}

export default sanitizeForLogging;
