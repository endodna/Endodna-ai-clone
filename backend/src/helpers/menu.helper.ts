import { Feature, MenuItem, UserType } from "../types";

const menu: MenuItem[] = [
  {
    id: "quick-actions",
    label: "Quick Actions",
    icon: "",
    path: "quick-actions",
    feature: Feature.QUICK_ACTIONS,
    allowedUserTypes: [UserType.ADMIN, UserType.DOCTOR],
    children: [
      
    ]
  },
];

export const getMenu = (userType: UserType) => {
  return menu.filter((item) =>
    item.allowedUserTypes.includes(userType),
  );
};
