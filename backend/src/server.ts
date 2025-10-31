import app from "./app";
import { logger } from "./helpers/logger.helper";
import QueueController from "./controllers/QueueController";

const PORT = process.env.PORT || 3001;

const server = app.listen(PORT, () => {
  logger.debug(`Server running on port ${PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV}`);

  QueueController.initializePolling();
});


process.on("SIGTERM", () => {
  logger.info("SIGTERM signal received");
  QueueController.stopAllPolling();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  logger.info("SIGINT signal received");
  QueueController.stopAllPolling();
  server.close(() => {
    logger.info("HTTP server closed");
    process.exit(0);
  });
});
