import winston from 'winston';

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'sync-service' },
  transports: [
    new winston.transports.File({ filename: 'sync-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'sync.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Sync status tracking
const syncStatus = {
  lastBatchSync: null,
  batchSyncInterval: 5 * 60 * 1000, // 5 minutes
  isRunning: false,
  stats: {
    totalBatches: 0,
    successfulBatches: 0,
    failedBatches: 0,
    lastError: null
  }
};

// Batch sync configuration
const BATCH_CONFIG = {
  batchSize: 100, // Process 100 records at a time
  retryAttempts: 3,
  retryDelay: 5000, // 5 seconds
  maxConcurrentBatches: 3
};

// Helper function to get records that need syncing
export async function getRecordsNeedingSync(Model, lastSyncTime) {
  try {
    let query = {};
    if (lastSyncTime) {
      query = { updatedAt: { $gt: lastSyncTime } };
    }

    const records = await Model.find(query).sort({ updatedAt: 1 }).limit(BATCH_CONFIG.batchSize);
    return records;
  } catch (error) {
    logger.error(`Error getting records for ${Model.modelName}:`, error);
    throw error;
  }
}

// Helper function to get all records for initial sync
export async function getAllRecordsForInitialSync(Model) {
  try {
    const records = await Model.find({}).sort({ createdAt: 1 });
    return records;
  } catch (error) {
    logger.error(`Error getting all records for ${Model.modelName}:`, error);
    throw error;
  }
}

// Helper function to sync a batch of records
export async function syncBatch(pool, collectionName, records, handler) {
  const results = {
    synced: 0,
    failed: 0,
    errors: []
  };

  for (const record of records) {
    try {
      await handler.insert(pool, record);
      results.synced++;
    } catch (error) {
      logger.error(`Failed to sync ${collectionName} record ${record._id}:`, error);
      results.failed++;
      results.errors.push({
        id: record._id,
        error: error.message
      });
    }
  }

  return results;
}

// Retry mechanism for failed operations
export async function retryOperation(operation, maxAttempts = BATCH_CONFIG.retryAttempts, delay = BATCH_CONFIG.retryDelay) {
  let lastError;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      logger.warn(`Attempt ${attempt}/${maxAttempts} failed:`, error.message);

      if (attempt < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Health check for databases
export async function checkDatabaseHealth(mongo, pool) {
  const health = {
    mongodb: false,
    sqlserver: false,
    errors: []
  };

  try {
    // Check MongoDB
    await mongo.connection.db.admin().ping();
    health.mongodb = true;
  } catch (error) {
    health.errors.push(`MongoDB health check failed: ${error.message}`);
  }

  try {
    // Check SQL Server
    await pool.request().query('SELECT 1');
    health.sqlserver = true;
  } catch (error) {
    health.errors.push(`SQL Server health check failed: ${error.message}`);
  }

  return health;
}

// Update sync status
export function updateSyncStatus(update) {
  Object.assign(syncStatus, update);
  logger.info('Sync status updated:', syncStatus);
}

// Get sync status
export function getSyncStatus() {
  return { ...syncStatus };
}

// Log sync metrics
export function logSyncMetrics(collectionName, batchResults, duration) {
  logger.info(`Batch sync completed for ${collectionName}`, {
    collection: collectionName,
    synced: batchResults.synced,
    failed: batchResults.failed,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  });

  if (batchResults.failed > 0) {
    logger.warn(`Batch sync failures for ${collectionName}:`, batchResults.errors);
  }
}

// Export logger and config
export { logger, BATCH_CONFIG, syncStatus };
