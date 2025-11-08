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
