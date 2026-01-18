import { Feature, PermissionAction, UserType } from "../types";

const Permissions: Partial<
  Record<UserType, Partial<Record<Feature, Record<PermissionAction, boolean>>>>
> = {
  [UserType.ADMIN]: {},
};

export const hasPermission = (
  userType: UserType,
  feature: Feature,
  action: PermissionAction,
): boolean => {
  return userType === UserType.SUPER_ADMIN || userType === UserType.ADMIN
    ? true
    : Permissions?.[userType]?.[feature]?.[action]
      ? true
      : false;
};

export const getPermissions = (userType: UserType) => {
  return Permissions[userType];
};

const RolePermissions: Record<UserType, string[]> = {
  [UserType.SUPER_ADMIN]: [
    // Patient permissions
    "patient:create",
    "patient:edit",
    "patient:view",
    "patient:delete",
    "patient:create-dosing",
    "patient:read-lab-results",
    "patient:create-lab-orders",
    "patient:view-medical-records",
    "patient:create-medical-records",
    "patient:edit-medical-records",
    "patient:delete-medical-records",
    "patient:view-dna-results",
    "patient:view-medications",
    "patient:create-medications",
    "patient:edit-medications",
    "patient:delete-medications",
    // Doctor permissions
    "doctor:create",
    "doctor:edit",
    "doctor:view",
    "doctor:delete",
    // Admin permissions
    "admin:create",
    "admin:edit",
    "admin:view",
    "admin:delete",
    // Organization permissions
    "organization:view",
    "organization:edit",
    "organization:settings",
    // Lab permissions
    "lab:view",
    "lab:create",
    "lab:edit",
    "lab:delete",
    // AI Assistant permissions
    "ai-assistant:use",
    // Quick Actions permissions
    "quick-actions:use",
    // Settings permissions
    "settings:view",
    "settings:edit",
    // Treatment Plan Templates permissions
    "treatment-plan-templates:view",
    "treatment-plan-templates:create",
    "treatment-plan-templates:edit",
    "treatment-plan-templates:delete",
    // Products permissions
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    // Integrations permissions
    "integrations:view",
    "integrations:edit",
    // Support permissions
    "support:view",
    "support:create",
  ],
  [UserType.ADMIN]: [
    // Patient permissions
    "patient:create",
    "patient:edit",
    "patient:view",
    "patient:delete",
    "patient:create-dosing",
    "patient:read-lab-results",
    "patient:create-lab-orders",
    "patient:view-medical-records",
    "patient:create-medical-records",
    "patient:edit-medical-records",
    "patient:delete-medical-records",
    "patient:view-dna-results",
    "patient:view-medications",
    "patient:create-medications",
    "patient:edit-medications",
    "patient:delete-medications",
    // Doctor permissions
    "doctor:create",
    "doctor:edit",
    "doctor:view",
    "doctor:delete",
    // Organization permissions
    "organization:view",
    "organization:edit",
    "organization:settings",
    // Lab permissions
    "lab:view",
    "lab:create",
    "lab:edit",
    "lab:delete",
    // AI Assistant permissions
    "ai-assistant:use",
    // Quick Actions permissions
    "quick-actions:use",
    // Settings permissions
    "settings:view",
    "settings:edit",
    // Treatment Plan Templates permissions
    "treatment-plan-templates:view",
    "treatment-plan-templates:create",
    "treatment-plan-templates:edit",
    "treatment-plan-templates:delete",
    // Products permissions
    "products:view",
    "products:create",
    "products:edit",
    "products:delete",
    // Integrations permissions
    "integrations:view",
    "integrations:edit",
    // Support permissions
    "support:view",
    "support:create",
  ],
  [UserType.DOCTOR]: [
    // Patient permissions
    "patient:view",
    "patient:edit",
    "patient:create-dosing",
    "patient:read-lab-results",
    "patient:create-lab-orders",
    "patient:view-medical-records",
    "patient:create-medical-records",
    "patient:edit-medical-records",
    "patient:view-dna-results",
    "patient:view-medications",
    "patient:create-medications",
    "patient:edit-medications",
    // AI Assistant permissions
    "ai-assistant:use",
    // Quick Actions permissions
    "quick-actions:use",
    // Profile permissions
    "profile:view",
    "profile:edit",
  ],
  [UserType.LICENSEE]: [
    // Patient permissions
    "patient:view",
    "patient:read-lab-results",
    "patient:view-medical-records",
    "patient:view-dna-results",
    "patient:view-medications",
    // Organization permissions
    "organization:view",
    // Profile permissions
    "profile:view",
    "profile:edit",
  ],
  [UserType.PATIENT]: [
    "profile:view",
    "profile:edit",
    "patient:view",
    "patient:read-lab-results",
    "patient:view-medical-records",
    "patient:view-dna-results",
    "patient:view-medications",
  ],
};


export const getRolePermissions = (role: UserType): string[] => {
  return RolePermissions[role] || [];
};


export const getAllRolePermissions = (): Record<string, string[]> => {
  return {
    [UserType.ADMIN]: getRolePermissions(UserType.ADMIN),
    [UserType.DOCTOR]: getRolePermissions(UserType.ADMIN),
    [UserType.LICENSEE]: getRolePermissions(UserType.LICENSEE),
    [UserType.PATIENT]: getRolePermissions(UserType.PATIENT),
  };
};
