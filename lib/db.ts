import mongoose from 'mongoose';
import sql from 'mssql';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/secure-qr';
const SQL_SERVER_CONFIG = {
  server: process.env.SQL_SERVER_HOST || 'testiis\\TESTSERVER',
  user: process.env.SQL_SERVER_USER || 'sa',
  password: process.env.SQL_SERVER_PASSWORD || '',
  database: process.env.SQL_SERVER_DATABASE || 'SecureQR',
  options: {
    encrypt: false, // Set to true if using Azure
    trustServerCertificate: true, // For local development
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

interface SQLCache {
  pool: sql.ConnectionPool | null;
  promise: Promise<sql.ConnectionPool> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
  var sqlPool: SQLCache | undefined;
}

let cached: MongooseCache = global.mongoose || {
  conn: null,
  promise: null,
};

let sqlCached: SQLCache = global.sqlPool || {
  pool: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

if (!global.sqlPool) {
  global.sqlPool = sqlCached;
}

async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

async function connectToSQLServer(): Promise<sql.ConnectionPool> {
  if (sqlCached.pool) {
    return sqlCached.pool;
  }

  if (!sqlCached.promise) {
    const pool = new sql.ConnectionPool(SQL_SERVER_CONFIG);
    sqlCached.promise = pool.connect().then(() => {
      console.log('Connected to SQL Server');
      return pool;
    });
  }


  try {
    sqlCached.pool = await sqlCached.promise;
  } catch (e) {
    sqlCached.promise = null;
    console.error('SQL Server connection failed:', e);
    throw e;
  }

  return sqlCached.pool;
}

// User Schema
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    expiresAt: { type: Date },
    features: [{ type: String }],
  },
  apiKeys: {
    publicKey: { type: String },
    privateKey: { type: String },
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// QR Code Schema
const QRCodeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, required: true },
  encryptedData: { type: String, required: true },
  signature: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true },
  expiresAt: { type: Date },
  useLimit: { type: Number },
  useCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// QR Code Scan Schema
const QRCodeScanSchema = new mongoose.Schema({
  qrCodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'QRCode', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['valid', 'invalid', 'expired'], required: true },
  ipAddress: { type: String },
  userAgent: { type: String },
  scanDate: { type: Date, default: Date.now },
});

// Password Reset Request Schema
const PasswordResetRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String, required: true },
  userName: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'failed'], default: 'pending' },
  approvedAt: { type: Date },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  requestedAt: { type: Date, default: Date.now },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Anonymous Usage Schema
const AnonymousUsageSchema = new mongoose.Schema({
  sessionId: { type: String, required: true },
  action: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed },
  ipAddress: { type: String },
  userAgent: { type: String },
  timestamp: { type: Date, default: Date.now },
});

// Models
const User = mongoose.models.User || mongoose.model('User', UserSchema);
const QRCode = mongoose.models.QRCode || mongoose.model('QRCode', QRCodeSchema);
const QRCodeScan = mongoose.models.QRCodeScan || mongoose.model('QRCodeScan', QRCodeScanSchema);
const PasswordResetRequest = mongoose.models.PasswordResetRequest || mongoose.model('PasswordResetRequest', PasswordResetRequestSchema);
const AnonymousUsage = mongoose.models.AnonymousUsage || mongoose.model('AnonymousUsage', AnonymousUsageSchema);

export {
  connectToDatabase,
  connectToSQLServer,
  User,
  QRCode,
  QRCodeScan,
  PasswordResetRequest,
  AnonymousUsage,
};
