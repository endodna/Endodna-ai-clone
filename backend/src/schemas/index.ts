import { z } from 'zod';

// Auth schemas
export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters')
}).strict();

export type LoginSchema = z.infer<typeof loginSchema>;

export const createSuperAdminSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  middleName: z.string().optional()
}).strict();
export type CreateSuperAdminSchema = z.infer<typeof createSuperAdminSchema>;


export const provisionOrganizationSchema = z.object({
  name: z.string().min(1, 'Name is required').trim(),
  isPrimary: z.boolean().optional().default(false),
  admin: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(6, 'Password must be at least 6 characters').optional(),
    firstName: z.string().min(1, 'First name is required'),
    lastName: z.string().min(1, 'Last name is required'),
    middleName: z.string().optional()
  }).strict(),
}).strict();

export type ProvisionOrganizationSchema = z.infer<typeof provisionOrganizationSchema>;
