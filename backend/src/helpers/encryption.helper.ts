import jwt from "jsonwebtoken";
import { supabase } from "../lib/supabase";
import { logger } from "./logger.helper";

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
