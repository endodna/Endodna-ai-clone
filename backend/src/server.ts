import app from './app';
import { logger } from './helpers/logger.helper';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.debug(`Server running on port ${PORT}`);
  logger.debug(`Environment: ${process.env.NODE_ENV}`);
});
