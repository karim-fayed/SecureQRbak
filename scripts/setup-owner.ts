import 'dotenv/config';
import mongoose from 'mongoose';
import { connectToDatabase, User } from '../lib/db';
import { hash } from 'bcrypt';

/**
 * Set up the owner account (karim-it@outlook.sa) with full admin privileges
 */
export async function setupOwner() {
  try {
    // Connect to the database
    await connectToDatabase();
    console.log('Connected to the database');

    const ownerEmail = 'karim-it@outlook.sa';
    const ownerPassword = process.env.OWNER_PASSWORD || 'SecureQR@2024'; // Default password, should be changed
    
    // Check if owner already exists
    const existingOwner = await User.findOne({ email: ownerEmail.toLowerCase() });
    
    if (existingOwner) {
      // Update existing user to be admin with full privileges
      console.log(`Found existing user: ${ownerEmail}`);
      
      const hashedPassword = await hash(ownerPassword, 10);
      
      existingOwner.role = 'admin';
      existingOwner.password = hashedPassword; // Update password
      existingOwner.subscription = {
        plan: 'enterprise',
        status: 'active'
      };
      
      // Ensure all API permissions are enabled
      existingOwner.apiPermissions = {
        createQRCode: true,
        viewStats: true,
        verifyQRCode: true
      };
      
      // Generate API keys if not exist
      if (!existingOwner.apiKeys?.public || !existingOwner.apiKeys?.private) {
        existingOwner.apiKeys = {
          public: process.env.API_PUBLIC_KEY || 'pofrrwcj',
          private: process.env.API_PRIVATE_KEY || '58c5b930-923d-40ce-8f94-1ca693c20034'
        };
      }
      
      await existingOwner.save();
      console.log(`✓ Updated ${ownerEmail} to be the system owner with full admin privileges`);
      console.log(`  - Role: admin`);
      console.log(`  - Subscription: enterprise (active)`);
      console.log(`  - API Keys: configured`);
      console.log(`  - Password: ${ownerPassword} (Please change this after first login!)`);
      
    } else {
      // Create new owner account
      console.log(`Creating new owner account: ${ownerEmail}`);
      
      const hashedPassword = await hash(ownerPassword, 10);
      
      const owner = await User.create({
        name: 'System Owner',
        email: ownerEmail.toLowerCase(),
        password: hashedPassword,
        role: 'admin',
        subscription: {
          plan: 'enterprise',
          status: 'active'
        },
        apiKeys: {
          public: process.env.API_PUBLIC_KEY || 'pofrrwcj',
          private: process.env.API_PRIVATE_KEY || '58c5b930-923d-40ce-8f94-1ca693c20034'
        },
        apiPermissions: {
          createQRCode: true,
          viewStats: true,
          verifyQRCode: true
        },
        securitySettings: {
          twoFactorEnabled: false,
          loginNotifications: true,
          trackQRCodeUsers: true
        },
        notificationSettings: {
          scanNotifications: true,
          failedVerificationAlerts: true,
          expirationAlerts: true,
          newsletter: false
        }
      });
      
      console.log(`✓ Created owner account successfully!`);
      console.log(`  - User ID: ${owner._id}`);
      console.log(`  - Email: ${ownerEmail}`);
      console.log(`  - Role: admin`);
      console.log(`  - Subscription: enterprise (active)`);
      console.log(`  - Password: ${ownerPassword} (Please change this after first login!)`);
      console.log(`\n⚠️  IMPORTANT: Change the password immediately after first login!`);
    }
    
    // Verify owner account
    const owner = await User.findOne({ email: ownerEmail.toLowerCase() });
    if (owner && owner.role === 'admin') {
      console.log(`\n✓ Verification: Owner account is configured correctly`);
      console.log(`  - Can access: /admin (Admin Dashboard)`);
      console.log(`  - Can manage: Users, System Settings, Logs`);
      console.log(`  - Full privileges: YES`);
    }
    
    // Close the connection
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
    
    return true;
  } catch (error) {
    console.error('Error setting up owner account:', error);
    return false;
  }
}

// Execute when run directly
if (require.main === module) {
  setupOwner()
    .then((success) => {
      if (success) {
        console.log('\n✓ Owner account setup completed successfully!');
        process.exit(0);
      } else {
        console.error('\n✗ Owner account setup failed!');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}


