import { prisma } from '../lib/prisma';
import { supabase } from '../lib/supabase';
import { Status, UserType as PrismaUserType, Priority } from '@prisma/client';
import { UserResponse } from '@supabase/supabase-js';

export interface CreateUserParams {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    middleName?: string;
    userType: PrismaUserType;
    organizationId: string;
}

export interface CreateUserResult {
    success: boolean;
    userId?: string;
    error?: string;
    message?: string;
}

export interface CreateUserAuditLogParams {
    userId: string;
    description: string;
    metadata: Record<string, any>;
    priority: Priority;
}


export class UserService {
    public static async createUser(params: CreateUserParams): Promise<CreateUserResult> {
        try {
            const {
                email,
                password,
                firstName,
                lastName,
                middleName,
                userType,
                organizationId
            } = params;

            const organization = await prisma.organization.findFirst({
                where: {
                    uuid: organizationId
                }
            });

            if (!organization) {
                return {
                    success: false,
                    error: 'InvalidOrganization',
                    message: 'Organization not found'
                };
            }

            const existingUser = await prisma.user.findFirst({
                where: { email }
            });

            if (existingUser) {
                return {
                    success: false,
                    error: 'UserEmailAlreadyExists',
                    message: 'User with this email already exists'
                };
            }

            const existingAdmin = await prisma.admin.findFirst({
                where: { email }
            });

            if (existingAdmin) {
                return {
                    success: false,
                    error: 'AdminEmailAlreadyExists',
                    message: 'Admin with this email already exists'
                };
            }

            let newSupabaseUser: UserResponse | null = null;
            if (password) {
                newSupabaseUser = await supabase.auth.admin.createUser({
                    email,
                    password,
                    email_confirm: true
                });
            } else {
                newSupabaseUser = await supabase.auth.admin.inviteUserByEmail(email, {
                    redirectTo: `${process.env.FRONTEND_URL}/auth/callback`
                });
            }

            if (!newSupabaseUser.data.user?.id) {
                return {
                    success: false,
                    error: newSupabaseUser.error?.code || 'FailedToCreateUser',
                    message: 'Failed to create user in Supabase'
                };
            }

            const newUserId = newSupabaseUser.data.user.id;

            await prisma.user.create({
                data: {
                    id: newUserId,
                    firstName,
                    lastName,
                    middleName,
                    email,
                    status: Status.ACTIVE,
                    userType,
                }
            });

            if (organization) {
                await prisma.organizationUser.create({
                    data: {
                        organizationId: organization.id,
                        userId: newUserId,
                        userType,
                    }
                });
            }

            return {
                success: true,
                userId: newUserId,
                message: 'User created successfully'
            };

        } catch (error) {
            console.error('Error creating user:', error);
            return {
                success: false,
                error: 'InternalServerError',
                message: 'Failed to create user'
            };
        }
    }


    public static async createOrganizationAdmin(params: Omit<CreateUserParams, 'userType'>): Promise<CreateUserResult> {
        return this.createUser({
            ...params,
            userType: PrismaUserType.ADMIN
        });
    }

    public static async createDoctor(params: Omit<CreateUserParams, 'userType'>): Promise<CreateUserResult> {
        return this.createUser({
            ...params,
            userType: PrismaUserType.DOCTOR
        });
    }

    public static async createPatient(params: Omit<CreateUserParams, 'userType'>): Promise<CreateUserResult> {
        return this.createUser({
            ...params,
            userType: PrismaUserType.PATIENT
        });
    }

    public static async createUserAuditLog(params: CreateUserAuditLogParams): Promise<void> {
        await prisma.userAuditLog.create({
            data: {
                ...params,
            }
        });
    }
}
