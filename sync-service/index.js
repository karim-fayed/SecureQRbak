import dotenv from "dotenv";
dotenv.config({ path: ".env.sync" });

import { connectMongo } from "./mongo.js";
import { getSqlPool, ensureAllTablesExist } from "./sql.js";
import { enqueue } from "./queue.js";
import {
    logger,
    getRecordsNeedingSync,
    getAllRecordsForInitialSync,
    syncBatch,
    checkDatabaseHealth,
    updateSyncStatus,
    getSyncStatus,
    logSyncMetrics,
    retryOperation,
    BATCH_CONFIG
} from "./utils.js";

import usersHandler from "./handlers/users.js";
import qrHandler from "./handlers/qrcodes.js";
import scansHandler from "./handlers/scans.js";
import passwordHandler from "./handlers/password-reset.js";
import anonymousHandler from "./handlers/anonymous.js";

async function startSync() {
    let mongo, pool;
    try {
        mongo = await connectMongo();
        pool = await getSqlPool();
    } catch (error) {
        logger.error("Failed to connect to databases:", error);
        // Continue with limited functionality if SQL Server is unavailable
        if (error.message.includes('MongoDB')) {
            mongo = null;
        } else {
            pool = null;
        }
    }

    if (!mongo) {
        logger.error("MongoDB connection failed, cannot start sync service");
        throw new Error("MongoDB connection required");
    }

    const User = mongo.model("User", new mongo.Schema({}, { strict: false }), "users");
    const QRCode = mongo.model("QRCode", new mongo.Schema({}, { strict: false }), "qrcodes");
    const Scan = mongo.model("QRCodeScan", new mongo.Schema({}, { strict: false }), "qrcodescans");
    const PassReset = mongo.model("PasswordResetRequest", new mongo.Schema({}, { strict: false }), "passwordresetrequests");
    const Anonymous = mongo.model("AnonymousUsage", new mongo.Schema({}, { strict: false }), "anonymoususage");

    logger.info("🚀 Sync Service Started with Enhanced Features");

    // Health check on startup
    const health = await checkDatabaseHealth(mongo, pool);
    if (!health.mongodb) {
        logger.error("MongoDB health check failed, exiting");
        process.exit(1);
    }

    if (!health.sqlserver) {
        logger.warn("SQL Server health check failed, running in MongoDB-only mode");
    }

    // Ensure tables exist in SQL Server (only if SQL Server is available)
    if (pool) {
        try {
            await ensureAllTablesExist(pool);
            logger.info("✅ All tables ensured in SQL Server");
        } catch (error) {
            logger.error("Failed to ensure tables exist:", error);
            throw error;
        }
    }

    // Initial sync (only if SQL Server is available and no previous sync)
    if (pool && !getSyncStatus().lastBatchSync) {
        try {
            logger.info("Running initial sync...");
            await runInitialSync(mongo, pool, [User, QRCode, Scan, PassReset, Anonymous]);
            logger.info("✅ Initial sync completed");
        } catch (error) {
            logger.error("Initial sync failed:", error);
            throw error;
        }
    }

    // Real-time sync via change streams (only if SQL Server is available)
    if (pool) {
        setupRealtimeSync(User, QRCode, Scan, PassReset, Anonymous, pool);
        // Batch sync scheduler
        setupBatchSyncScheduler(mongo, pool, [User, QRCode, Scan, PassReset, Anonymous]);
    } else {
        logger.warn("Skipping real-time and batch sync due to SQL Server unavailability");
    }

    // Health monitoring
    setupHealthMonitoring(mongo, pool);
}

function setupRealtimeSync(User, QRCode, Scan, PassReset, Anonymous, pool) {
    logger.info("Setting up real-time sync via change streams...");

    User.watch().on("change", change => {
        if (change.operationType === "insert") {
            enqueue(() => retryOperation(() => usersHandler.insert(pool, change.fullDocument)), "User Insert");
        } else if (change.operationType === "update") {
            enqueue(() => retryOperation(() => usersHandler.update(pool, change.fullDocument)), "User Update");
        } else if (change.operationType === "delete") {
            enqueue(() => retryOperation(() => usersHandler.delete(pool, change.documentKey)), "User Delete");
        }
    });

    QRCode.watch().on("change", change => {
        if (change.operationType === "insert") {
            enqueue(() => retryOperation(() => qrHandler.insert(pool, change.fullDocument)), "QRCode Insert");
        } else if (change.operationType === "update") {
            enqueue(() => retryOperation(() => qrHandler.update(pool, change.fullDocument)), "QRCode Update");
        } else if (change.operationType === "delete") {
            enqueue(() => retryOperation(() => qrHandler.delete(pool, change.documentKey)), "QRCode Delete");
        }
    });

    Scan.watch().on("change", change => {
        if (change.operationType === "insert") {
            enqueue(() => retryOperation(() => scansHandler.insert(pool, change.fullDocument)), "Scan Insert");
        } else if (change.operationType === "update") {
            enqueue(() => retryOperation(() => scansHandler.update(pool, change.fullDocument)), "Scan Update");
        } else if (change.operationType === "delete") {
            enqueue(() => retryOperation(() => scansHandler.delete(pool, change.documentKey)), "Scan Delete");
        }
    });

    PassReset.watch().on("change", change => {
        if (change.operationType === "insert") {
            enqueue(() => retryOperation(() => passwordHandler.insert(pool, change.fullDocument)), "Password Reset Insert");
        } else if (change.operationType === "update") {
            enqueue(() => retryOperation(() => passwordHandler.update(pool, change.fullDocument)), "Password Reset Update");
        } else if (change.operationType === "delete") {
            enqueue(() => retryOperation(() => passwordHandler.delete(pool, change.documentKey)), "Password Reset Delete");
        }
    });

    Anonymous.watch().on("change", change => {
        if (change.operationType === "insert") {
            enqueue(() => retryOperation(() => anonymousHandler.insert(pool, change.fullDocument)), "Anonymous Insert");
        } else if (change.operationType === "update") {
            enqueue(() => retryOperation(() => anonymousHandler.update(pool, change.fullDocument)), "Anonymous Update");
        } else if (change.operationType === "delete") {
            enqueue(() => retryOperation(() => anonymousHandler.delete(pool, change.documentKey)), "Anonymous Delete");
        }
    });
}

async function setupBatchSyncScheduler(mongo, pool, models) {
    logger.info("Setting up batch sync scheduler...");

    const runBatchSync = async () => {
        if (getSyncStatus().isRunning) {
            logger.warn("Batch sync already running, skipping...");
            return;
        }

        updateSyncStatus({ isRunning: true });
        const startTime = Date.now();

        try {
            logger.info("Starting batch sync...");

            const collections = [
                { name: 'users', model: models[0], handler: usersHandler },
                { name: 'qrcodes', model: models[1], handler: qrHandler },
                { name: 'qrcodescans', model: models[2], handler: scansHandler },
                { name: 'passwordresetrequests', model: models[3], handler: passwordHandler },
                { name: 'anonymoususage', model: models[4], handler: anonymousHandler }
            ];

            let totalSynced = 0;
            let totalFailed = 0;

            for (const collection of collections) {
                try {
                    const lastSyncTime = getSyncStatus().lastBatchSync;
                    const records = await getRecordsNeedingSync(collection.model, lastSyncTime);

                    if (records.length > 0) {
                        logger.info(`Processing ${records.length} records for ${collection.name}`);
                        const batchStart = Date.now();
                        const results = await syncBatch(pool, collection.name, records, collection.handler);
                        const batchDuration = Date.now() - batchStart;

                        logSyncMetrics(collection.name, results, batchDuration);
                        totalSynced += results.synced;
                        totalFailed += results.failed;
                    }
                } catch (error) {
                    logger.error(`Batch sync failed for ${collection.name}:`, error);
                    totalFailed++;
                }
            }

            updateSyncStatus({
                lastBatchSync: new Date(),
                stats: {
                    ...getSyncStatus().stats,
                    totalBatches: getSyncStatus().stats.totalBatches + 1,
                    successfulBatches: totalFailed === 0 ? getSyncStatus().stats.successfulBatches + 1 : getSyncStatus().stats.successfulBatches,
                    failedBatches: totalFailed > 0 ? getSyncStatus().stats.failedBatches + 1 : getSyncStatus().stats.failedBatches,
                    lastError: totalFailed > 0 ? `Failed to sync ${totalFailed} collections` : null
                }
            });

            logger.info(`Batch sync completed: ${totalSynced} synced, ${totalFailed} failed`);

        } catch (error) {
            logger.error("Batch sync error:", error);
            updateSyncStatus({
                stats: {
                    ...getSyncStatus().stats,
                    failedBatches: getSyncStatus().stats.failedBatches + 1,
                    lastError: error.message
                }
            });
        } finally {
            updateSyncStatus({ isRunning: false });
        }
    };

    // Run initial batch sync
    await runBatchSync();

    // Schedule batch sync every 5 minutes
    setInterval(runBatchSync, 5 * 60 * 1000);
}

function setupHealthMonitoring(mongo, pool) {
    logger.info("Setting up health monitoring...");

    setInterval(async () => {
        const health = await checkDatabaseHealth(mongo, pool);
        if (!health.mongodb || !health.sqlserver) {
            logger.error("Database health check failed:", health.errors);
            // Could send alerts here
        }
    }, 60000); // Check every minute
}

// Initial sync function
async function runInitialSync(mongo, pool, models) {
    logger.info("Starting initial sync of all existing MongoDB data to SQL Server...");

    const collections = [
        { name: 'users', model: models[0], handler: usersHandler },
        { name: 'qrcodes', model: models[1], handler: qrHandler },
        { name: 'qrcodescans', model: models[2], handler: scansHandler },
        { name: 'passwordresetrequests', model: models[3], handler: passwordHandler },
        { name: 'anonymoususage', model: models[4], handler: anonymousHandler }
    ];

    let totalSynced = 0;
    let totalFailed = 0;

    for (const collection of collections) {
        try {
            logger.info(`Syncing all records for ${collection.name}...`);
            const records = await getAllRecordsForInitialSync(collection.model);

            if (records.length > 0) {
                logger.info(`Processing ${records.length} records for ${collection.name}`);
                const results = await syncBatch(pool, collection.name, records, collection.handler);
                totalSynced += results.synced;
                totalFailed += results.failed;
                logger.info(`Synced ${results.synced} records for ${collection.name}, failed: ${results.failed}`);
            } else {
                logger.info(`No records found for ${collection.name}`);
            }
        } catch (error) {
            logger.error(`Initial sync failed for ${collection.name}:`, error);
            totalFailed++;
        }
    }

    logger.info(`Initial sync completed: ${totalSynced} total synced, ${totalFailed} collections failed`);

    // Set initial sync timestamp
    updateSyncStatus({ lastBatchSync: new Date() });
}

// Graceful shutdown
process.on('SIGINT', () => {
    logger.info('Received SIGINT, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGTERM', () => {
    logger.info('Received SIGTERM, shutting down gracefully...');
    process.exit(0);
});

startSync().catch(error => {
    logger.error("Failed to start sync service:", error);
    process.exit(1);
});
