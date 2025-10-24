import { Feature, MenuItem, PermissionAction, UserType } from "../types";
import { hasPermission } from "./rbac.helper";

const menu: MenuItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: "dashboard",
    path: "dashboard",
    feature: Feature.DASHBOARD,
    permission: PermissionAction.VIEW,
  },
];

export const getMenu = (userType: UserType) => {
  return menu.filter((item) =>
    hasPermission(userType, item.feature, item.permission),
  );
};
