import { Feature, PermissionAction, UserType } from "../types";

const Permissions: Partial<
  Record<UserType, Partial<Record<Feature, Record<PermissionAction, boolean>>>>
> = {
  [UserType.ADMIN]: {
    [Feature.DASHBOARD]: {
      [PermissionAction.VIEW]: true,
      [PermissionAction.CREATE]: true,
      [PermissionAction.DELETE]: true,
      [PermissionAction.EDIT]: true,
    },
  },
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
