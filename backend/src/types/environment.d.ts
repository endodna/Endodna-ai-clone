declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: "development" | "staging" | "production";
      PORT?: string;
      JWT_SECRET: string;
      DATABASE_URL: string;
      API_URL: string;
      SUPABASE_URL: string;
      SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;
      REDIS_URL: string;
    }
  }
}

export {};
