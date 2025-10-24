import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface MenuItem {
  path: string;
  name: string;
  permissions?: string[];
}

interface MenuContextType {
  menuItems: MenuItem[];
  loading: boolean;
  hasAccess: (path: string) => boolean;
  refreshMenu: () => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

interface MenuProviderProps {
  children: ReactNode;
}

export const MenuProvider: React.FC<MenuProviderProps> = ({ children }) => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenu = async () => {
    try {
      setLoading(true);
      // const result = await api.misc.getMenu()
      // if (result.data.success) {
      //     setMenuItems(result.data || [])
      // } else {
      //     console.error('Failed to fetch menu:', result.error)
      //     setMenuItems([])
      // }
    } catch (error) {
      console.error("Menu fetch error:", error);
      setMenuItems([]);
    } finally {
      setLoading(false);
    }
  };

  const hasAccess = (path: string): boolean => {
    if (path === "/") return true;
    return menuItems.some((item) => item.path === path);
  };

  const refreshMenu = async () => {
    await fetchMenu();
  };

  useEffect(() => {
    fetchMenu();
  }, []);

  const value = {
    menuItems,
    loading,
    hasAccess,
    refreshMenu,
  };

  return <MenuContext.Provider value={value}>{children}</MenuContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useMenu = () => {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenu must be used within a MenuProvider");
  }
  return context;
};
