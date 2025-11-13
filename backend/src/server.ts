import app from "./app";
import { logger } from "./helpers/logger.helper";
import queueService from "./services/queue/queue.service";
import cronService from "./services/cron/cron.service";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  logger.debug(`Server running on port ${PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV}`);

  if (process.env.NODE_ENV === "production") {
    queueService.initializePolling();
  }

  cronService.initialize().catch((error) => {
    logger.error("Failed to initialize cron jobs", {
      error: error,
    });
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received");
  queueService.stopAllPolling();
  cronService.stopAll();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received");
  queueService.stopAllPolling();
  cronService.stopAll();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});
