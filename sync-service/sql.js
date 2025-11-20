import sql from "mssql";
import dotenv from "dotenv";
import winston from "winston";

dotenv.config({ path: ".env.sync" });

const logger = winston.createLogger({
    transports: [new winston.transports.Console()]
});

export async function getSqlPool() {
    try {
        // Parse server and instance from SQL_SERVER env var
        const serverParts = process.env.SQL_SERVER.split('\\');
        const server = serverParts[0];
        const instanceName = serverParts[1] || undefined;

        const pool = await sql.connect({
            user: process.env.SQL_USER,
            password: process.env.SQL_PASSWORD,
            server: server,
            database: process.env.SQL_DATABASE,
            port: parseInt(process.env.SQL_PORT, 10) || 1433, // المنفذ الافتراضي
            options: {
                trustServerCertificate: true,
                instanceName: instanceName,
                encrypt: false
            },
            connectionTimeout: 30000, // زيادة وقت المهلة لتجنب timeout
        });

        console.log("✅ SQL Connected");
        await createTables(pool);
        return pool;
    } catch (err) {
        console.error("❌ SQL Connection Failed:", err);
        return null;
    }
}

export async function createTables(pool) {
    const createUsers = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='Users' AND xtype='U')
        CREATE TABLE Users (
            id INT IDENTITY(1,1) PRIMARY KEY,
            mongoId NVARCHAR(50) UNIQUE,
            name NVARCHAR(255),
            email NVARCHAR(255),
            password NVARCHAR(255),
            role NVARCHAR(50),
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME
        )
    `;

    const createQRCodes = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QRCodes' AND xtype='U')
        CREATE TABLE QRCodes (
            id INT IDENTITY(1,1) PRIMARY KEY,
            mongoId NVARCHAR(50) UNIQUE,
            name NVARCHAR(255),
            data NVARCHAR(MAX),
            encryptedData NVARCHAR(MAX),
            signature NVARCHAR(MAX),
            userId NVARCHAR(50),
            isActive BIT,
            createdAt DATETIME DEFAULT GETDATE(),
            updatedAt DATETIME
        )
    `;

    const createQRCodeScans = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='QRCodeScans' AND xtype='U')
        CREATE TABLE QRCodeScans (
            id INT IDENTITY(1,1) PRIMARY KEY,
            mongoId NVARCHAR(50) UNIQUE,
            qrCodeId NVARCHAR(50),
            userId NVARCHAR(50),
            status NVARCHAR(50),
            ipAddress NVARCHAR(50),
            userAgent NVARCHAR(MAX),
            createdAt DATETIME DEFAULT GETDATE()
        )
    `;

    const createPasswordResetRequests = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='PasswordResetRequests' AND xtype='U')
        CREATE TABLE PasswordResetRequests (
            id INT IDENTITY(1,1) PRIMARY KEY,
            mongoId NVARCHAR(50) UNIQUE,
            userId NVARCHAR(50),
            userEmail NVARCHAR(255),
            userName NVARCHAR(255),
            status NVARCHAR(50),
            createdAt DATETIME DEFAULT GETDATE()
        )
    `;

    const createAnonymousUsage = `
        IF NOT EXISTS (SELECT * FROM sysobjects WHERE name='AnonymousUsage' AND xtype='U')
        CREATE TABLE AnonymousUsage (
            id INT IDENTITY(1,1) PRIMARY KEY,
            mongoId NVARCHAR(50) UNIQUE,
            sessionId NVARCHAR(50),
            action NVARCHAR(50),
            data NVARCHAR(MAX),
            ipAddress NVARCHAR(50),
            userAgent NVARCHAR(MAX),
            createdAt DATETIME DEFAULT GETDATE()
        )
    `;

    const tables = [createUsers, createQRCodes, createQRCodeScans, createPasswordResetRequests, createAnonymousUsage];

    for (const sqlQuery of tables) {
        await pool.request().query(sqlQuery);
    }

    console.log("✅ Tables created or already exist");
}

// Function to check and create missing tables
export async function ensureAllTablesExist(pool) {
    const tables = [
        {
            name: 'Users',
            schema: `
                IF OBJECT_ID('Users', 'U') IS NULL
                CREATE TABLE Users (
                    id VARCHAR(24) PRIMARY KEY,
                    name NVARCHAR(255),
                    email NVARCHAR(255),
                    password NVARCHAR(255),
                    role NVARCHAR(50),
                    createdAt DATETIME
                )
            `
        },
        {
            name: 'QRCodes',
            schema: `
                IF OBJECT_ID('QRCodes', 'U') IS NULL
                CREATE TABLE QRCodes (
                    id VARCHAR(24) PRIMARY KEY,
                    name NVARCHAR(255),
                    data NVARCHAR(MAX),
                    encryptedData NVARCHAR(MAX),
                    signature NVARCHAR(MAX),
                    userId VARCHAR(24),
                    isActive BIT,
                    createdAt DATETIME
                )
            `
        },
        {
            name: 'QRCodeScans',
            schema: `
                IF OBJECT_ID('QRCodeScans', 'U') IS NULL
                CREATE TABLE QRCodeScans (
                    id VARCHAR(24) PRIMARY KEY,
                    qrCodeId VARCHAR(24),
                    userId VARCHAR(24),
                    status NVARCHAR(50),
                    ipAddress NVARCHAR(50),
                    userAgent NVARCHAR(MAX),
                    createdAt DATETIME
                )
            `
        },
        {
            name: 'PasswordResetRequests',
            schema: `
                IF OBJECT_ID('PasswordResetRequests', 'U') IS NULL
                CREATE TABLE PasswordResetRequests (
                    id VARCHAR(24) PRIMARY KEY,
                    userId VARCHAR(24),
                    userEmail NVARCHAR(255),
                    userName NVARCHAR(255),
                    status NVARCHAR(50),
                    createdAt DATETIME
                )
            `
        },
        {
            name: 'AnonymousUsage',
            schema: `
                IF OBJECT_ID('AnonymousUsage', 'U') IS NULL
                CREATE TABLE AnonymousUsage (
                    id VARCHAR(24) PRIMARY KEY,
                    sessionId NVARCHAR(255),
                    action NVARCHAR(255),
                    data NVARCHAR(MAX),
                    ipAddress NVARCHAR(50),
                    userAgent NVARCHAR(MAX),
                    createdAt DATETIME
                )
            `
        }
    ];

    for (const table of tables) {
        try {
            await pool.request().query(table.schema);
            logger.info(`✅ Table ${table.name} ensured`);
        } catch (error) {
            logger.error(`❌ Failed to create table ${table.name}:`, error);
            throw error;
        }
    }
}
