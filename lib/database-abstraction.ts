import { connectToDatabase, connectToSQLServer, User, QRCode, QRCodeScan, PasswordResetRequest, AnonymousUsage } from './db';
import * as sql from 'mssql';

// Database abstraction layer for dual database operations
// MongoDB is primary, SQL Server is backup/replica

export interface DatabaseOperationResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  source: 'mongodb' | 'sqlserver';
}

export interface DualWriteResult {
  mongoSuccess: boolean;
  sqlSuccess: boolean;
  mongoError?: string;
  sqlError?: string;
}

// Generic function to execute operations on both databases
export async function executeDualOperation<T>(
  mongoOperation: () => Promise<T>,
  sqlOperation: () => Promise<T>,
  operationName: string
): Promise<DualWriteResult> {
  let mongoSuccess = false;
  let sqlSuccess = false;
  let mongoError: string | undefined;
  let sqlError: string | undefined;

  try {
    // Execute on MongoDB first (primary)
    await mongoOperation();
    mongoSuccess = true;
  } catch (error) {
    mongoError = error instanceof Error ? error.message : 'Unknown MongoDB error';
    console.error(`MongoDB ${operationName} failed:`, error);
  }

  try {
    // Execute on SQL Server (replica)
    await sqlOperation();
    sqlSuccess = true;
  } catch (error) {
    sqlError = error instanceof Error ? error.message : 'Unknown SQL Server error';
    console.error(`SQL Server ${operationName} failed:`, error);
  }

  return {
    mongoSuccess,
    sqlSuccess,
    mongoError,
    sqlError,
  };
}

// Read operation with fallback: MongoDB first, SQL Server if MongoDB fails
export async function readWithFallback<T>(
  mongoRead: () => Promise<T>,
  sqlRead: () => Promise<T>,
  operationName: string
): Promise<DatabaseOperationResult<T>> {
  try {
    // Try MongoDB first
    const data = await mongoRead();
    return {
      success: true,
      data,
      source: 'mongodb',
    };
  } catch (mongoError) {
    console.warn(`MongoDB ${operationName} failed, trying SQL Server:`, mongoError);

    try {
      // Fallback to SQL Server
      const data = await sqlRead();
      return {
        success: true,
        data,
        source: 'sqlserver',
      };
    } catch (sqlError) {
      console.error(`Both databases failed for ${operationName}:`, { mongoError, sqlError });
      return {
        success: false,
        error: `Both databases unavailable: MongoDB - ${mongoError instanceof Error ? mongoError.message : 'Unknown error'}, SQL Server - ${sqlError instanceof Error ? sqlError.message : 'Unknown error'}`,
        source: 'mongodb', // Default to mongodb as primary
      };
    }
  }
}

// User operations
export const userOperations = {
  create: async (userData: {
    name: string;
    email: string;
    password: string;
    role?: string;
    subscription?: any;
    apiKeys?: any;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      const user = new User(userData);
      await user.save();
      return user;
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      const request = pool.request();

      await request
        .input('name', sql.NVarChar, userData.name)
        .input('email', sql.NVarChar, userData.email)
        .input('password', sql.NVarChar, userData.password)
        .input('role', sql.NVarChar, userData.role || 'user')
        .input('subscription_plan', sql.NVarChar, userData.subscription?.plan || 'free')
        .input('subscription_expiresAt', sql.DateTime, userData.subscription?.expiresAt)
        .input('subscription_features', sql.NVarChar, JSON.stringify(userData.subscription?.features || []))
        .input('apiKeys_publicKey', sql.NVarChar, userData.apiKeys?.publicKey)
        .input('apiKeys_privateKey', sql.NVarChar, userData.apiKeys?.privateKey)
        .query(`
          INSERT INTO Users (name, email, password, role, subscription_plan, subscription_expiresAt, subscription_features, apiKeys_publicKey, apiKeys_privateKey, createdAt, updatedAt)
          VALUES (@name, @email, @password, @role, @subscription_plan, @subscription_expiresAt, @subscription_features, @apiKeys_publicKey, @apiKeys_privateKey, GETDATE(), GETDATE())
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'User creation');
  },

  findById: async (id: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await User.findById(id).select('-password');
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('SELECT * FROM Users WHERE id = @id');

      if (result.recordset.length === 0) {
        throw new Error('User not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'User findById');
  },

  findByEmail: async (email: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await User.findOne({ email });
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('email', sql.NVarChar, email)
        .query('SELECT * FROM Users WHERE email = @email');

      if (result.recordset.length === 0) {
        throw new Error('User not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'User findByEmail');
  },

  update: async (id: string, updateData: any): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      await connectToDatabase();
      return await User.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      const request = pool.request();

      let query = 'UPDATE Users SET updatedAt = GETDATE()';
      const inputs: any[] = [];

      if (updateData.name) {
        query += ', name = @name';
        request.input('name', sql.NVarChar, updateData.name);
      }
      if (updateData.email) {
        query += ', email = @email';
        request.input('email', sql.NVarChar, updateData.email);
      }
      if (updateData.role) {
        query += ', role = @role';
        request.input('role', sql.NVarChar, updateData.role);
      }
      if (updateData.password) {
        query += ', password = @password';
        request.input('password', sql.NVarChar, updateData.password);
      }
      if (updateData.subscription) {
        query += ', subscription_plan = @subscription_plan';
        request.input('subscription_plan', sql.NVarChar, updateData.subscription.plan || 'free');
        if (updateData.subscription.expiresAt) {
          query += ', subscription_expiresAt = @subscription_expiresAt';
          request.input('subscription_expiresAt', sql.DateTime, updateData.subscription.expiresAt);
        }
        if (updateData.subscription.features) {
          query += ', subscription_features = @subscription_features';
          request.input('subscription_features', sql.NVarChar, JSON.stringify(updateData.subscription.features));
        }
      }
      if (updateData.apiKeys) {
        if (updateData.apiKeys.publicKey) {
          query += ', apiKeys_publicKey = @apiKeys_publicKey';
          request.input('apiKeys_publicKey', sql.NVarChar, updateData.apiKeys.publicKey);
        }
        if (updateData.apiKeys.privateKey) {
          query += ', apiKeys_privateKey = @apiKeys_privateKey';
          request.input('apiKeys_privateKey', sql.NVarChar, updateData.apiKeys.privateKey);
        }
      }

      query += ' WHERE id = @id';
      request.input('id', sql.Int, parseInt(id));

      await request.query(query);
    };

    return executeDualOperation(mongoOp, sqlOp, 'User update');
  },

  findAll: async (filter?: any, options?: { limit?: number; skip?: number; sort?: any }) => {
    const mongoRead = async () => {
      await connectToDatabase();
      let query = User.find(filter || {}).select('-password');

      if (options?.sort) {
        query = query.sort(options.sort);
      }
      if (options?.skip) {
        query = query.skip(options.skip);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return await query;
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      let query = 'SELECT * FROM Users WHERE 1=1';
      const request = pool.request();

      // Add filters if provided
      if (filter?.role) {
        query += ' AND role = @role';
        request.input('role', sql.NVarChar, filter.role);
      }
      if (filter?.email) {
        query += ' AND email LIKE @email';
        request.input('email', sql.NVarChar, `%${filter.email}%`);
      }

      // Add sorting
      if (options?.sort) {
        const sortFields = [];
        for (const [field, order] of Object.entries(options.sort)) {
          sortFields.push(`${field} ${order === 1 ? 'ASC' : 'DESC'}`);
        }
        if (sortFields.length > 0) {
          query += ` ORDER BY ${sortFields.join(', ')}`;
        }
      }

      // Add pagination
      if (options?.limit) {
        query += ' OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('skip', sql.Int, options.skip || 0);
        request.input('limit', sql.Int, options.limit);
      }

      const result = await request.query(query);
      return result.recordset;
    };

    return readWithFallback(mongoRead, sqlRead, 'User findAll');
  },
};

// Anonymous Usage operations
export const anonymousUsageOperations = {
  create: async (usageData: {
    ipAddress: string;
    userAgent: string;
    count: number;
    lastUsed: Date;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      const usage = new AnonymousUsage(usageData);
      await usage.save();
      return usage;
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('ipAddress', sql.NVarChar, usageData.ipAddress)
        .input('userAgent', sql.NVarChar, usageData.userAgent)
        .input('count', sql.Int, usageData.count)
        .input('lastUsed', sql.DateTime, usageData.lastUsed)
        .query(`
          INSERT INTO AnonymousUsage (ipAddress, userAgent, count, lastUsed, createdAt)
          VALUES (@ipAddress, @userAgent, @count, @lastUsed, GETDATE())
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'Anonymous Usage creation');
  },

  findByIp: async (ipAddress: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await AnonymousUsage.findOne({ ipAddress });
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('ipAddress', sql.NVarChar, ipAddress)
        .query('SELECT * FROM AnonymousUsage WHERE ipAddress = @ipAddress');

      if (result.recordset.length === 0) {
        throw new Error('Anonymous usage not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'Anonymous Usage findByIp');
  },

  update: async (ipAddress: string, updateData: {
    count: number;
    lastUsed: Date;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      await connectToDatabase();
      return await AnonymousUsage.findOneAndUpdate(
        { ipAddress },
        { ...updateData, updatedAt: new Date() },
        { new: true }
      );
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('ipAddress', sql.NVarChar, ipAddress)
        .input('count', sql.Int, updateData.count)
        .input('lastUsed', sql.DateTime, updateData.lastUsed)
        .query(`
          UPDATE AnonymousUsage
          SET count = @count, lastUsed = @lastUsed, updatedAt = GETDATE()
          WHERE ipAddress = @ipAddress
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'Anonymous Usage update');
  },
};

// QR Code operations
export const qrCodeOperations = {
  create: async (qrData: {
    name: string;
    data: any;
    encryptedData: string;
    signature: string;
    userId: string;
    isActive?: boolean;
    expiresAt?: Date;
    useLimit?: number;
    useCount?: number;
    anonymousCreation?: boolean;
    verificationCode?: string;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      const qrCode = new QRCode(qrData);
      await qrCode.save();
      return qrCode;
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('name', sql.NVarChar, qrData.name)
        .input('data', sql.NVarChar, JSON.stringify(qrData.data))
        .input('encryptedData', sql.NVarChar, qrData.encryptedData)
        .input('signature', sql.NVarChar, qrData.signature)
        .input('userId', sql.Int, qrData.userId ? parseInt(qrData.userId) : null)
        .input('isActive', sql.Bit, qrData.isActive ?? true)
        .input('expiresAt', sql.DateTime, qrData.expiresAt)
        .input('useLimit', sql.Int, qrData.useLimit)
        .input('useCount', sql.Int, qrData.useCount ?? 0)
        .input('anonymousCreation', sql.Bit, qrData.anonymousCreation ?? false)
        .input('verificationCode', sql.NVarChar, qrData.verificationCode)
        .query(`
          INSERT INTO QRCodes (name, data, encryptedData, signature, userId, isActive, expiresAt, useLimit, useCount, anonymousCreation, verificationCode, createdAt, updatedAt)
          VALUES (@name, @data, @encryptedData, @signature, @userId, @isActive, @expiresAt, @useLimit, @useCount, @anonymousCreation, @verificationCode, GETDATE(), GETDATE())
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'QR Code creation');
  },

  findByUserId: async (userId: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await QRCode.find({ userId });
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('userId', sql.Int, parseInt(userId))
        .query('SELECT * FROM QRCodes WHERE userId = @userId');

      return result.recordset;
    };

    return readWithFallback(mongoRead, sqlRead, 'QR Code findByUserId');
  },

  findByVerificationCode: async (verificationCode: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await QRCode.findOne({ verificationCode });
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('verificationCode', sql.NVarChar, verificationCode)
        .query('SELECT * FROM QRCodes WHERE verificationCode = @verificationCode');

      if (result.recordset.length === 0) {
        throw new Error('QR Code not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'QR Code findByVerificationCode');
  },

  findById: async (id: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await QRCode.findById(id);
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('SELECT * FROM QRCodes WHERE id = @id');

      if (result.recordset.length === 0) {
        throw new Error('QR Code not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'QR Code findById');
  },

  update: async (id: string, updateData: any): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      await connectToDatabase();
      return await QRCode.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      const request = pool.request();

      let query = 'UPDATE QRCodes SET updatedAt = GETDATE()';

      if (updateData.useCount !== undefined) {
        query += ', useCount = @useCount';
        request.input('useCount', sql.Int, updateData.useCount);
      }
      if (updateData.isActive !== undefined) {
        query += ', isActive = @isActive';
        request.input('isActive', sql.Bit, updateData.isActive);
      }

      query += ' WHERE id = @id';
      request.input('id', sql.Int, parseInt(id));

      await request.query(query);
    };

    return executeDualOperation(mongoOp, sqlOp, 'QR Code update');
  },

  delete: async (id: string): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      await connectToDatabase();
      return await QRCode.findByIdAndDelete(id);
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('DELETE FROM QRCodes WHERE id = @id');
    };

    return executeDualOperation(mongoOp, sqlOp, 'QR Code delete');
  },
};

// QR Code Scan operations
export const qrScanOperations = {
  create: async (scanData: {
    qrCodeId: string;
    userId?: string;
    status: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      const scan = new QRCodeScan(scanData);
      await scan.save();
      return scan;
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('qrCodeId', sql.Int, parseInt(scanData.qrCodeId))
        .input('userId', sql.Int, scanData.userId ? parseInt(scanData.userId) : null)
        .input('status', sql.NVarChar, scanData.status)
        .input('ipAddress', sql.NVarChar, scanData.ipAddress)
        .input('userAgent', sql.NVarChar, scanData.userAgent)
        .query(`
          INSERT INTO QRCodeScans (qrCodeId, userId, status, ipAddress, userAgent, scanDate)
          VALUES (@qrCodeId, @userId, @status, @ipAddress, @userAgent, GETDATE())
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'QR Scan creation');
  },

  countDocuments: async (filter?: any) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await QRCodeScan.countDocuments(filter || {});
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      let query = 'SELECT COUNT(*) as count FROM QRCodeScans';
      const request = pool.request();

      if (filter?.status) {
        query += ' WHERE status = @status';
        request.input('status', sql.NVarChar, filter.status);
      }

      const result = await request.query(query);
      return result.recordset[0].count;
    };

    return readWithFallback(mongoRead, sqlRead, 'QR Scan count');
  },
};

// Password Reset Request operations
export const passwordResetOperations = {
  create: async (resetData: {
    userId: string;
    userEmail: string;
    userName: string;
    status?: string;
    notes?: string;
  }): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      const resetRequest = new PasswordResetRequest(resetData);
      await resetRequest.save();
      return resetRequest;
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      await pool.request()
        .input('userId', sql.Int, parseInt(resetData.userId))
        .input('userEmail', sql.NVarChar, resetData.userEmail)
        .input('userName', sql.NVarChar, resetData.userName)
        .input('status', sql.NVarChar, resetData.status || 'pending')
        .input('notes', sql.NVarChar, resetData.notes)
        .query(`
          INSERT INTO PasswordResetRequests (userId, userEmail, userName, status, notes, requestedAt, createdAt, updatedAt)
          VALUES (@userId, @userEmail, @userName, @status, @notes, GETDATE(), GETDATE(), GETDATE())
        `);
    };

    return executeDualOperation(mongoOp, sqlOp, 'Password Reset Request creation');
  },

  findById: async (id: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await PasswordResetRequest.findById(id);
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('id', sql.Int, parseInt(id))
        .query('SELECT * FROM PasswordResetRequests WHERE id = @id');

      if (result.recordset.length === 0) {
        throw new Error('Password reset request not found');
      }

      return result.recordset[0];
    };

    return readWithFallback(mongoRead, sqlRead, 'Password Reset Request findById');
  },

  findByUserId: async (userId: string) => {
    const mongoRead = async () => {
      await connectToDatabase();
      return await PasswordResetRequest.find({ userId });
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      const result = await pool.request()
        .input('userId', sql.Int, parseInt(userId))
        .query('SELECT * FROM PasswordResetRequests WHERE userId = @userId');

      return result.recordset;
    };

    return readWithFallback(mongoRead, sqlRead, 'Password Reset Request findByUserId');
  },

  update: async (id: string, updateData: any): Promise<DualWriteResult> => {
    const mongoOp = async () => {
      await connectToDatabase();
      return await PasswordResetRequest.findByIdAndUpdate(id, { ...updateData, updatedAt: new Date() }, { new: true });
    };

    const sqlOp = async () => {
      const pool = await connectToSQLServer();
      const request = pool.request();

      let query = 'UPDATE PasswordResetRequests SET updatedAt = GETDATE()';
      const inputs: any[] = [];

      if (updateData.status) {
        query += ', status = @status';
        request.input('status', sql.NVarChar, updateData.status);
      }
      if (updateData.approvedAt) {
        query += ', approvedAt = @approvedAt';
        request.input('approvedAt', sql.DateTime, updateData.approvedAt);
      }
      if (updateData.approvedBy) {
        query += ', approvedBy = @approvedBy';
        request.input('approvedBy', sql.Int, parseInt(updateData.approvedBy));
      }
      if (updateData.notes) {
        query += ', notes = @notes';
        request.input('notes', sql.NVarChar, updateData.notes);
      }

      query += ' WHERE id = @id';
      request.input('id', sql.Int, parseInt(id));

      await request.query(query);
    };

    return executeDualOperation(mongoOp, sqlOp, 'Password Reset Request update');
  },

  findAll: async (filter?: any, options?: { limit?: number; skip?: number; sort?: any }) => {
    const mongoRead = async () => {
      await connectToDatabase();
      let query = PasswordResetRequest.find(filter || {});

      if (options?.sort) {
        query = query.sort(options.sort);
      }
      if (options?.skip) {
        query = query.skip(options.skip);
      }
      if (options?.limit) {
        query = query.limit(options.limit);
      }

      return await query.populate('approvedBy', 'name');
    };

    const sqlRead = async () => {
      const pool = await connectToSQLServer();
      let query = 'SELECT pr.*, u.name as approvedBy_name FROM PasswordResetRequests pr LEFT JOIN Users u ON pr.approvedBy = u.id WHERE 1=1';
      const request = pool.request();

      // Add filters if provided
      if (filter?.status) {
        query += ' AND pr.status = @status';
        request.input('status', sql.NVarChar, filter.status);
      }

      // Add sorting
      if (options?.sort) {
        const sortFields = [];
        for (const [field, order] of Object.entries(options.sort)) {
          sortFields.push(`pr.${field} ${order === 1 ? 'ASC' : 'DESC'}`);
        }
        if (sortFields.length > 0) {
          query += ` ORDER BY ${sortFields.join(', ')}`;
        }
      }

      // Add pagination
      if (options?.limit) {
        query += ' OFFSET @skip ROWS FETCH NEXT @limit ROWS ONLY';
        request.input('skip', sql.Int, options.skip || 0);
        request.input('limit', sql.Int, options.limit);
      }

      const result = await request.query(query);
      return result.recordset.map(row => ({
        ...row,
        approvedBy: row.approvedBy ? { name: row.approvedBy_name } : null
      }));
    };

    return readWithFallback(mongoRead, sqlRead, 'Password Reset Request findAll');
  },
};
