import app from "./app";
import { logger } from "./helpers/logger.helper";
import QueueController from "./controllers/QueueController";
import cronService from "./services/cron/cron.service";
import ragHelper from "./helpers/rag.helper";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, async () => {
  logger.debug(`Server running on port ${PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV}`);

  try {
    await ragHelper.invalidateAllPatientSummaryCaches();
  } catch (error) {
    logger.error("Failed to invalidate patient summary caches on startup", {
      error: error,
    });
  }

  if (process.env.NODE_ENV === "production") {
    QueueController.initializePolling();
  }

  cronService.initialize().catch((error) => {
    logger.error("Failed to initialize cron jobs", {
      error: error,
    });
  });
});

process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received");
  QueueController.stopAllPolling();
  cronService.stopAll();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received");
  QueueController.stopAllPolling();
  cronService.stopAll();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});
