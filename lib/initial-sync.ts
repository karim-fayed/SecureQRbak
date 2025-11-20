import { connectToDatabase, connectToSQLServer, User, QRCode, QRCodeScan, PasswordResetRequest, AnonymousUsage } from './db';
import sql from 'mssql';

export interface SyncResult {
  collection: string;
  totalRecords: number;
  syncedRecords: number;
  errors: number;
  duration: number;
}

export class DatabaseSynchronizer {
  private sqlPool: sql.ConnectionPool | null = null;

  async initialize(): Promise<void> {
    this.sqlPool = await connectToSQLServer();
  }

  async syncAllCollections(): Promise<SyncResult[]> {
    const results: SyncResult[] = [];

    console.log('Starting initial database synchronization...');

    // Sync in order of dependencies
    results.push(await this.syncUsers());
    results.push(await this.syncQRCodes());
    results.push(await this.syncQRCodeScans());
    results.push(await this.syncPasswordResetRequests());
    results.push(await this.syncAnonymousUsage());

    console.log('Database synchronization completed');
    return results;
  }

  private async syncUsers(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('Syncing Users collection...');

    try {
      await connectToDatabase();
      const users = await User.find({}).lean();
      let syncedRecords = 0;
      let errors = 0;

      if (!this.sqlPool) throw new Error('SQL Server connection not initialized');

      // Clear existing data
      await this.sqlPool.request().query('DELETE FROM Users');

      for (const user of users) {
        try {
          await this.sqlPool.request()
            .input('id', sql.Int, parseInt((user._id as any).toString()))
            .input('name', sql.NVarChar, user.name)
            .input('email', sql.NVarChar, user.email)
            .input('password', sql.NVarChar, user.password)
            .input('role', sql.NVarChar, user.role || 'user')
            .input('subscription_plan', sql.NVarChar, user.subscription?.plan || 'free')
            .input('subscription_expiresAt', sql.DateTime, user.subscription?.expiresAt)
            .input('subscription_features', sql.NVarChar, JSON.stringify(user.subscription?.features || []))
            .input('apiKeys_publicKey', sql.NVarChar, user.apiKeys?.publicKey)
            .input('apiKeys_privateKey', sql.NVarChar, user.apiKeys?.privateKey)
            .input('createdAt', sql.DateTime, user.createdAt)
            .input('updatedAt', sql.DateTime, user.updatedAt)
            .query(`
              SET IDENTITY_INSERT Users ON;
              INSERT INTO Users (id, name, email, password, role, subscription_plan, subscription_expiresAt, subscription_features, apiKeys_publicKey, apiKeys_privateKey, createdAt, updatedAt)
              VALUES (@id, @name, @email, @password, @role, @subscription_plan, @subscription_expiresAt, @subscription_features, @apiKeys_publicKey, @apiKeys_privateKey, @createdAt, @updatedAt);
              SET IDENTITY_INSERT Users OFF;
            `);

          syncedRecords++;
        } catch (error) {
          console.error(`Error syncing user ${user._id}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`Users sync completed: ${syncedRecords}/${users.length} records synced, ${errors} errors`);

      return {
        collection: 'Users',
        totalRecords: users.length,
        syncedRecords,
        errors,
        duration,
      };
    } catch (error) {
      console.error('Users sync failed:', error);
      return {
        collection: 'Users',
        totalRecords: 0,
        syncedRecords: 0,
        errors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  private async syncQRCodes(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('Syncing QRCodes collection...');

    try {
      await connectToDatabase();
      const qrCodes = await QRCode.find({}).lean();
      let syncedRecords = 0;
      let errors = 0;

      if (!this.sqlPool) throw new Error('SQL Server connection not initialized');

      // Clear existing data
      await this.sqlPool.request().query('DELETE FROM QRCodes');

      for (const qrCode of qrCodes) {
        try {
          await this.sqlPool.request()
            .input('id', sql.Int, parseInt((qrCode._id as any).toString()))
            .input('name', sql.NVarChar, qrCode.name)
            .input('data', sql.NVarChar, JSON.stringify(qrCode.data))
            .input('encryptedData', sql.NVarChar, qrCode.encryptedData)
            .input('signature', sql.NVarChar, qrCode.signature)
            .input('userId', sql.Int, parseInt(qrCode.userId.toString()))
            .input('isActive', sql.Bit, qrCode.isActive ?? true)
            .input('expiresAt', sql.DateTime, qrCode.expiresAt)
            .input('useLimit', sql.Int, qrCode.useLimit)
            .input('useCount', sql.Int, qrCode.useCount || 0)
            .input('createdAt', sql.DateTime, qrCode.createdAt)
            .input('updatedAt', sql.DateTime, qrCode.updatedAt)
            .query(`
              SET IDENTITY_INSERT QRCodes ON;
              INSERT INTO QRCodes (id, name, data, encryptedData, signature, userId, isActive, expiresAt, useLimit, useCount, createdAt, updatedAt)
              VALUES (@id, @name, @data, @encryptedData, @signature, @userId, @isActive, @expiresAt, @useLimit, @useCount, @createdAt, @updatedAt);
              SET IDENTITY_INSERT QRCodes OFF;
            `);

          syncedRecords++;
        } catch (error) {
          console.error(`Error syncing QR code ${qrCode._id}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`QRCodes sync completed: ${syncedRecords}/${qrCodes.length} records synced, ${errors} errors`);

      return {
        collection: 'QRCodes',
        totalRecords: qrCodes.length,
        syncedRecords,
        errors,
        duration,
      };
    } catch (error) {
      console.error('QRCodes sync failed:', error);
      return {
        collection: 'QRCodes',
        totalRecords: 0,
        syncedRecords: 0,
        errors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  private async syncQRCodeScans(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('Syncing QRCodeScans collection...');

    try {
      await connectToDatabase();
      const scans = await QRCodeScan.find({}).lean();
      let syncedRecords = 0;
      let errors = 0;

      if (!this.sqlPool) throw new Error('SQL Server connection not initialized');

      // Clear existing data
      await this.sqlPool.request().query('DELETE FROM QRCodeScans');

      for (const scan of scans) {
        try {
          await this.sqlPool.request()
            .input('id', sql.Int, parseInt((scan._id as any).toString()))
            .input('qrCodeId', sql.Int, parseInt(scan.qrCodeId.toString()))
            .input('userId', sql.Int, scan.userId ? parseInt(scan.userId.toString()) : null)
            .input('status', sql.NVarChar, scan.status)
            .input('ipAddress', sql.NVarChar, scan.ipAddress)
            .input('userAgent', sql.NVarChar, scan.userAgent)
            .input('scanDate', sql.DateTime, scan.scanDate)
            .query(`
              SET IDENTITY_INSERT QRCodeScans ON;
              INSERT INTO QRCodeScans (id, qrCodeId, userId, status, ipAddress, userAgent, scanDate)
              VALUES (@id, @qrCodeId, @userId, @status, @ipAddress, @userAgent, @scanDate);
              SET IDENTITY_INSERT QRCodeScans OFF;
            `);

          syncedRecords++;
        } catch (error) {
          console.error(`Error syncing scan ${scan._id}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`QRCodeScans sync completed: ${syncedRecords}/${scans.length} records synced, ${errors} errors`);

      return {
        collection: 'QRCodeScans',
        totalRecords: scans.length,
        syncedRecords,
        errors,
        duration,
      };
    } catch (error) {
      console.error('QRCodeScans sync failed:', error);
      return {
        collection: 'QRCodeScans',
        totalRecords: 0,
        syncedRecords: 0,
        errors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  private async syncPasswordResetRequests(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('Syncing PasswordResetRequests collection...');

    try {
      await connectToDatabase();
      const requests = await PasswordResetRequest.find({}).lean();
      let syncedRecords = 0;
      let errors = 0;

      if (!this.sqlPool) throw new Error('SQL Server connection not initialized');

      // Clear existing data
      await this.sqlPool.request().query('DELETE FROM PasswordResetRequests');

      for (const request of requests) {
        try {
          await this.sqlPool.request()
            .input('id', sql.Int, parseInt((request._id as any).toString()))
            .input('userId', sql.Int, parseInt(request.userId.toString()))
            .input('userEmail', sql.NVarChar, request.userEmail)
            .input('userName', sql.NVarChar, request.userName)
            .input('status', sql.NVarChar, request.status || 'pending')
            .input('approvedAt', sql.DateTime, request.approvedAt)
            .input('approvedBy', sql.Int, request.approvedBy ? parseInt(request.approvedBy.toString()) : null)
            .input('requestedAt', sql.DateTime, request.requestedAt)
            .input('notes', sql.NVarChar, request.notes)
            .input('createdAt', sql.DateTime, request.createdAt)
            .input('updatedAt', sql.DateTime, request.updatedAt)
            .query(`
              SET IDENTITY_INSERT PasswordResetRequests ON;
              INSERT INTO PasswordResetRequests (id, userId, userEmail, userName, status, approvedAt, approvedBy, requestedAt, notes, createdAt, updatedAt)
              VALUES (@id, @userId, @userEmail, @userName, @status, @approvedAt, @approvedBy, @requestedAt, @notes, @createdAt, @updatedAt);
              SET IDENTITY_INSERT PasswordResetRequests OFF;
            `);

          syncedRecords++;
        } catch (error) {
          console.error(`Error syncing password reset request ${request._id}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`PasswordResetRequests sync completed: ${syncedRecords}/${requests.length} records synced, ${errors} errors`);

      return {
        collection: 'PasswordResetRequests',
        totalRecords: requests.length,
        syncedRecords,
        errors,
        duration,
      };
    } catch (error) {
      console.error('PasswordResetRequests sync failed:', error);
      return {
        collection: 'PasswordResetRequests',
        totalRecords: 0,
        syncedRecords: 0,
        errors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  private async syncAnonymousUsage(): Promise<SyncResult> {
    const startTime = Date.now();
    console.log('Syncing AnonymousUsage collection...');

    try {
      await connectToDatabase();
      const usages = await AnonymousUsage.find({}).lean();
      let syncedRecords = 0;
      let errors = 0;

      if (!this.sqlPool) throw new Error('SQL Server connection not initialized');

      // Clear existing data
      await this.sqlPool.request().query('DELETE FROM AnonymousUsage');

      for (const usage of usages) {
        try {
          await this.sqlPool.request()
            .input('id', sql.Int, parseInt((usage._id as any).toString()))
            .input('sessionId', sql.NVarChar, usage.sessionId)
            .input('action', sql.NVarChar, usage.action)
            .input('data', sql.NVarChar, JSON.stringify(usage.data))
            .input('ipAddress', sql.NVarChar, usage.ipAddress)
            .input('userAgent', sql.NVarChar, usage.userAgent)
            .input('timestamp', sql.DateTime, usage.timestamp)
            .query(`
              SET IDENTITY_INSERT AnonymousUsage ON;
              INSERT INTO AnonymousUsage (id, sessionId, action, data, ipAddress, userAgent, timestamp)
              VALUES (@id, @sessionId, @action, @data, @ipAddress, @userAgent, @timestamp);
              SET IDENTITY_INSERT AnonymousUsage OFF;
            `);

          syncedRecords++;
        } catch (error) {
          console.error(`Error syncing anonymous usage ${usage._id}:`, error);
          errors++;
        }
      }

      const duration = Date.now() - startTime;
      console.log(`AnonymousUsage sync completed: ${syncedRecords}/${usages.length} records synced, ${errors} errors`);

      return {
        collection: 'AnonymousUsage',
        totalRecords: usages.length,
        syncedRecords,
        errors,
        duration,
      };
    } catch (error) {
      console.error('AnonymousUsage sync failed:', error);
      return {
        collection: 'AnonymousUsage',
        totalRecords: 0,
        syncedRecords: 0,
        errors: 1,
        duration: Date.now() - startTime,
      };
    }
  }

  async close(): Promise<void> {
    if (this.sqlPool) {
      await this.sqlPool.close();
      this.sqlPool = null;
    }
  }
}

// Utility function to run initial sync
export async function runInitialSync(): Promise<SyncResult[]> {
  const synchronizer = new DatabaseSynchronizer();

  try {
    await synchronizer.initialize();
    const results = await synchronizer.syncAllCollections();
    return results;
  } finally {
    await synchronizer.close();
  }
}
