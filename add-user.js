const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://karimfayed:%7Cl0v3N%40fes@qrcodes.mkhuc6l.mongodb.net/?retryWrites=true&w=majority&appName=QRCodes";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  language: { type: String, default: 'ar' },
  timezone: { type: String, default: 'asia-riyadh' },
  subscription: {
    plan: { type: String, enum: ['free', 'premium', 'enterprise'], default: 'free' },
    status: { type: String, enum: ['active', 'inactive', 'cancelled'], default: 'active' },
    expiresAt: Date,
  },
  apiKeys: {
    public: String,
    private: String,
  },
  apiPermissions: {
    createQRCode: { type: Boolean, default: true },
    viewStats: { type: Boolean, default: true },
    verifyQRCode: { type: Boolean, default: true },
  },
  securitySettings: {
    twoFactorEnabled: { type: Boolean, default: false },
    loginNotifications: { type: Boolean, default: true },
    trackQRCodeUsers: { type: Boolean, default: true },
  },
  notificationSettings: {
    scanNotifications: { type: Boolean, default: true },
    failedVerificationAlerts: { type: Boolean, default: true },
    expirationAlerts: { type: Boolean, default: true },
    newsletter: { type: Boolean, default: false },
  },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);

async function addUser() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingUser = await User.findOne({ email: 'karim-it@outlook.sa' });
    if (existingUser) {
      console.log('User already exists');
      return;
    }

    const hashedPassword = await bcrypt.hash('test123', 10);
    const newUser = new User({
      name: 'Karim Ahmed',
      email: 'karim-it@outlook.sa',
      password: hashedPassword,
      role: 'admin',
    });

    await newUser.save();
    console.log('User added successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

addUser();
