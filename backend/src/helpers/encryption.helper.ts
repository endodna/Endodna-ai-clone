import jwt from "jsonwebtoken";
import crypto from "crypto";
import { supabase } from "../lib/supabase";
import { logger } from "./logger.helper";
import { TransferTokens } from "./transfer-code.helper";

export const signJWTToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

export const verifyJWTToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const getSupabaseClaims = async (token: string) => {
  const { data, error } = await supabase.auth.getClaims(token, {
    allowExpired: false,
  });
  if (error) {
    throw error;
  }
  return data;
};

export const verifySupabaseToken = async (token: string, traceId?: string) => {
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);
    if (error) {
      throw error;
    }
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    logger.debug("Supabase token verification error", {
      traceId,
      error: error,
      method: "verifySupabaseToken",
    });
    return null;
  }
};

function getEncryptionKey(): Buffer {
  const encryptionKey = process.env.TRANSFER_CODE_ENCRYPTION_KEY;
  if (!encryptionKey) {
    throw new Error("TRANSFER_CODE_ENCRYPTION_KEY environment variable is not set");
  }

  const key = Buffer.from(encryptionKey, "hex");
  if (key.length !== 32) {
    throw new Error("TRANSFER_CODE_ENCRYPTION_KEY must be 32 bytes (64 hex characters)");
  }

  return key;
}

export function encryptData(data: string): string {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);

  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");

  return `${iv.toString("hex")}:${encrypted}`;
}

export function decryptData(encrypted: string): string {
  const key = getEncryptionKey();

  const parts = encrypted.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedData = parts[1];

  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

  let decrypted = decipher.update(encryptedData, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

export function encryptTokens(tokens: TransferTokens): string {
  const dataString = JSON.stringify(tokens);
  return encryptData(dataString);
}

export function decryptTokens(encrypted: string): TransferTokens {
  const decrypted = decryptData(encrypted);
  return JSON.parse(decrypted) as TransferTokens;
}

export function encryptSessionData(sessionData: string): string {
  return encryptData(sessionData);
}

export function decryptSessionData(encrypted: string): string {
  return decryptData(encrypted);
}

export function encryptRefreshToken(refreshToken: string): string {
  return encryptData(refreshToken);
}

export function decryptRefreshToken(encrypted: string): string {
  return decryptData(encrypted);
}

export function generate32bitRandomBytes(): string {
  return crypto.randomBytes(32).toString("hex");
}
