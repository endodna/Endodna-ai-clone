import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express, { Request, Response } from "express";
import { sendResponse } from "./helpers/response.helper";
import { logger } from "./helpers/logger.helper";
import helmet from "helmet";
import * as bodyParser from "body-parser";
import { rateLimiter } from "./middlewares/RateLimiter";
import { requestLogger } from "./middlewares/Logger";
import v1Router from "./routes/v1";
import { redis } from "./lib/redis";
import { StatusCode } from "./types";

// Connect to Redis
redis.connect();

const app = express();

// MiddleWares
app.use(bodyParser.urlencoded({ extended: false }));
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// app.use(
//   // bodyParser.json({
//   //   verify: function (req: Request, res, buf) {
//   //     req.rawBody = buf;
//   //   },
//   // })
// );
app.use(bodyParser.json());
app.use(cors());
app.use(helmet());
app.use(requestLogger);

//Rate limiting all API endpoints.
app.use("/", rateLimiter.regular);

app.use("/api/v1/", v1Router);

app.get("/health", (req: Request, res: Response) => {
  sendResponse(res, {
    status: StatusCode.OK,
    data: {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      version: process.env.npm_package_version,
    },
    message: "Server is running",
  });
});

// Middleware Error Handler
app.use(function (req: Request, res: Response) {
  sendResponse(res, { status: StatusCode.NOT_FOUND, error: true });
});

//Handle Server Error
app.use(function (error: Error, req: Request, res: Response) {
  sendResponse(res, { status: StatusCode.INTERNAL_SERVER_ERROR, error: true });
});

process.on("unhandledRejection", function (error) {
  logger.error("Unhandled rejection", { error: error });
});

process.on("uncaughtException", function (error) {
  logger.error("Uncaught exception", { error: error });
});

// starting the app
export default app;
