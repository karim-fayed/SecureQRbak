-- SQL Server schema for SecureQR backup database
-- This script creates tables equivalent to MongoDB collections

USE SecureQR;
GO

-- Users table
CREATE TABLE Users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    email NVARCHAR(255) NOT NULL UNIQUE,
    password NVARCHAR(255) NOT NULL,
    role NVARCHAR(50) DEFAULT 'user',
    subscription_plan NVARCHAR(50) DEFAULT 'free',
    subscription_expiresAt DATETIME NULL,
    subscription_features NVARCHAR(MAX) NULL, -- JSON string
    apiKeys_publicKey NVARCHAR(255) NULL,
    apiKeys_privateKey NVARCHAR(255) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE()
);

-- QR Codes table
CREATE TABLE QRCodes (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    data NVARCHAR(MAX) NOT NULL, -- JSON string
    encryptedData NVARCHAR(MAX) NOT NULL,
    signature NVARCHAR(MAX) NOT NULL,
    userId INT NOT NULL,
    isActive BIT DEFAULT 1,
    expiresAt DATETIME NULL,
    useLimit INT NULL,
    useCount INT DEFAULT 0,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- QR Code Scans table
CREATE TABLE QRCodeScans (
    id INT IDENTITY(1,1) PRIMARY KEY,
    qrCodeId INT NOT NULL,
    userId INT NULL,
    status NVARCHAR(50) NOT NULL,
    ipAddress NVARCHAR(45) NULL,
    userAgent NVARCHAR(MAX) NULL,
    scanDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (qrCodeId) REFERENCES QRCodes(id),
    FOREIGN KEY (userId) REFERENCES Users(id)
);

-- Password Reset Requests table
CREATE TABLE PasswordResetRequests (
    id INT IDENTITY(1,1) PRIMARY KEY,
    userId INT NOT NULL,
    userEmail NVARCHAR(255) NOT NULL,
    userName NVARCHAR(255) NOT NULL,
    status NVARCHAR(50) DEFAULT 'pending',
    approvedAt DATETIME NULL,
    approvedBy INT NULL,
    requestedAt DATETIME DEFAULT GETDATE(),
    notes NVARCHAR(MAX) NULL,
    createdAt DATETIME DEFAULT GETDATE(),
    updatedAt DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (userId) REFERENCES Users(id),
    FOREIGN KEY (approvedBy) REFERENCES Users(id)
);

-- Anonymous Usage table
CREATE TABLE AnonymousUsage (
    id INT IDENTITY(1,1) PRIMARY KEY,
    sessionId NVARCHAR(255) NOT NULL,
    action NVARCHAR(255) NOT NULL,
    data NVARCHAR(MAX) NULL, -- JSON string
    ipAddress NVARCHAR(45) NULL,
    userAgent NVARCHAR(MAX) NULL,
    timestamp DATETIME DEFAULT GETDATE()
);

-- Indexes for better performance
CREATE INDEX IX_Users_Email ON Users(email);
CREATE INDEX IX_QRCodes_UserId ON QRCodes(userId);
CREATE INDEX IX_QRCodeScans_QRCodeId ON QRCodeScans(qrCodeId);
CREATE INDEX IX_QRCodeScans_Status ON QRCodeScans(status);
CREATE INDEX IX_QRCodeScans_ScanDate ON QRCodeScans(scanDate);
CREATE INDEX IX_PasswordResetRequests_UserId ON PasswordResetRequests(userId);
CREATE INDEX IX_PasswordResetRequests_Status ON PasswordResetRequests(status);
CREATE INDEX IX_AnonymousUsage_SessionId ON AnonymousUsage(sessionId);
CREATE INDEX IX_AnonymousUsage_Timestamp ON AnonymousUsage(timestamp);

-- Triggers to update updatedAt column
CREATE TRIGGER TR_Users_Update
ON Users
AFTER UPDATE
AS
BEGIN
    UPDATE Users
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted)
END;

CREATE TRIGGER TR_QRCodes_Update
ON QRCodes
AFTER UPDATE
AS
BEGIN
    UPDATE QRCodes
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted)
END;

CREATE TRIGGER TR_PasswordResetRequests_Update
ON PasswordResetRequests
AFTER UPDATE
AS
BEGIN
    UPDATE PasswordResetRequests
    SET updatedAt = GETDATE()
    WHERE id IN (SELECT id FROM inserted)
END;
