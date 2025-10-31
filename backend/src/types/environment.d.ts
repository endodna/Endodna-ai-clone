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
      SQS_PROCESSING_QUEUE_URL: string;
      SQS_TEMPUS_LAB_QUEUE_URL: string;
      CLOUDWATCH_LOG_ARN: string;
      CLOUDWATCH_LOG_GROUP: string;
    }
  }
}

export { };
