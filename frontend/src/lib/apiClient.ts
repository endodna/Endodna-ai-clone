import axios, {
  AxiosInstance,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from "axios";
import { supabase } from "../lib/supabase";
import { getCurrentOrgSlug, isLoginSubdomain, getSubdomain, buildIdUrl, DEFAULT_ORG_SLUG } from "../utils/subdomain";

const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api/v1",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`, {
      data: config.data,
      params: config.params,
      headers: config.headers,
    });

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (session?.access_token) {
      config.headers.Authorization = `Bearer ${session.access_token}`;
    }

    const hostname = typeof window !== "undefined" ? window.location.hostname : "";
    if (hostname.includes("bios.test") || hostname === "localhost" || hostname === "127.0.0.1") {
      const orgSlug = getCurrentOrgSlug();
      if (orgSlug) {
        config.headers["X-Org-Slug"] = orgSlug;
      }
    }

    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    console.log(
      `API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`,
      {
        status: response.status,
        data: response.data,
      },
    );
    return response;
  },
  async (error) => {
    console.error(
      `API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`,
      {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      },
    );

    if (error.response?.status === 401) {
      console.log("Unauthorized access detected, clearing session and redirecting to ID subdomain");

      const currentSubdomain = getSubdomain();
      const isOnIdSubdomain = isLoginSubdomain();
      const orgSlug = currentSubdomain && !isOnIdSubdomain ? currentSubdomain : null;

      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error("Error signing out:", error);
      }

      try {
        localStorage.removeItem("userConfig");

        const keysToRemove: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("sb-") && key.endsWith("-auth-token")) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach((key) => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn(`Failed to remove Supabase key ${key}:`, e);
          }
        });

        if (typeof document !== "undefined") {
          const cookies = document.cookie.split(";");
          cookies.forEach((cookie) => {
            const cookieName = cookie.split("=")[0].trim();
            if (cookieName.startsWith("sb-") && cookieName.endsWith("-auth-token")) {
              const domains = [".bios.test", ".bios.med", ""];
              domains.forEach((domain) => {
                if (domain) {
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=${domain};`;
                } else {
                  document.cookie = `${cookieName}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
                }
              });
            }
          });
        }
      } catch (clearError) {
        console.error("Error clearing user config and tokens:", clearError);
      }

      if (!isOnIdSubdomain) {
        if (orgSlug && orgSlug !== DEFAULT_ORG_SLUG) {
          window.location.href = buildIdUrl(`/?org=${orgSlug}&logout=true`);
        } else {
          window.location.href = buildIdUrl("/?logout=true");
        }
      } else {
        window.location.replace("/");
      }
    }

    if (error.response?.status === 404 && error.response?.data?.message?.includes("Organization")) {
      console.warn("Organization not found - may be accessing wrong subdomain");
    }

    return Promise.reject(error);
  },
);

export default apiClient;
