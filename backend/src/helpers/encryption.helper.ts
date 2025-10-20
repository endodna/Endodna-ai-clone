import jwt from 'jsonwebtoken';
import { supabase } from '../lib/supabase';
import { UserType } from '../types';

export const signJWTToken = (payload: any): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '7d'
  });
};

export const verifyJWTToken = (token: string): any => {
  return jwt.verify(token, process.env.JWT_SECRET!);
};

export const getSupabaseClaims = async (token: string) => {
  const { data, error } = await supabase.auth.getClaims(token, { allowExpired: false });
  if (error) {
    throw error;
  }
  return data;
}

export const verifySupabaseToken = async (token: string) => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if(error){
      throw error;
    }
    if (!user) {
      return null;
    }
    return user;
  } catch (error) {
    console.error('Supabase token verification error:', error);
    return null;
  }
};
