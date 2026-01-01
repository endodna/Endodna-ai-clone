import { createContext, useContext, ReactNode, useMemo } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { ApiResponse } from "@/handlers/api/api";
import { useAuth } from "./AuthContext";
import { supabase } from "@/lib/supabase";
import { useGetConstants } from "@/hooks/useDoctor";

/**
 * Constants context value type
 */
interface ConstantsContextValue {
  constants: Constants | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => void;
  queryResult: UseQueryResult<ApiResponse<Constants>, Error>;
}

/**
 * Constants context
 */
const ConstantsContext = createContext<ConstantsContextValue | undefined>(undefined);

interface ConstantsProviderProps {
  children: ReactNode;
}

/**
 * Helper query: confirm stable session directly from Supabase.
 * The query key is tied to the current user id so it reruns immediately
 * when authentication state changes (no manual refresh required).
 */
function useSessionReady(userId: string | null) {
  return useQuery({
    queryKey: ["auth", "stableSession", userId ?? "guest"],
    queryFn: async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.access_token) throw new Error("No session");
      return data.session;
    },
    staleTime: Infinity,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    enabled: !!userId,
  });
}

export function ConstantsProvider({ children }: Readonly<ConstantsProviderProps>) {
  const { user, loading: authLoading, userConfig } = useAuth();

  const sessionQuery = useSessionReady(user?.id ?? null);
  const isSessionReady = useMemo(
    () =>
      !!user &&
      !authLoading &&
      !!userConfig.userType &&
      sessionQuery.status === "success",
    [user, authLoading, userConfig.userType, sessionQuery.status]
  );

  /**
   * Constants fetch (only enabled when session is fully ready)
   */
  const queryResult = useGetConstants({
    enabled: isSessionReady,
  });

  const value: ConstantsContextValue = useMemo(
    () => ({
      constants: queryResult.data?.data ?? null,
      isLoading: queryResult.isLoading,
      isError: queryResult.isError,
      error: queryResult.error ?? null,
      refetch: queryResult.refetch,
      queryResult,
    }),
    [queryResult]
  );

  return <ConstantsContext.Provider value={value}>{children}</ConstantsContext.Provider>;
}

export function useConstants(): ConstantsContextValue {
  const context = useContext(ConstantsContext);
  if (context === undefined) {
    throw new Error("useConstants must be used within a ConstantsProvider");
  }
  return context;
}
