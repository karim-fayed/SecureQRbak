// A script to debug user login issues
const mongoose = require('mongoose');
require('dotenv').config();

// Secret key for JWT signing
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://...";
console.log("Using connection string:", MONGODB_URI);

async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    process.exit(1);
  }
}

// Define a simple schema for User to query the database
const UserSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
});

// Function to find a user and display relevant info
async function findUser(email) {
  try {
    await connectToDatabase();
    const User = mongoose.model('User', UserSchema);
    
    // Try to find a user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log(`No user found with email: ${email}`);
      return;
    }
    
    console.log("User found:");
    console.log({
      _id: user._id,
      name: user.name,
      email: user.email,
      passwordLength: user.password ? user.password.length : 0,
      hasPassword: !!user.password,
    });
    
  } catch (error) {
    console.error("Error finding user:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// Function to list all users
async function listAllUsers() {
  try {
    await connectToDatabase();
    const User = mongoose.model('User', UserSchema);
    
    // Find all users
    const users = await User.find({});
    
    if (users.length === 0) {
      console.log("No users found in the database");
      return;
    }
    
    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log({
        _id: user._id,
        name: user.name,
        email: user.email,
        passwordLength: user.password ? user.password.length : 0,
        hasPassword: !!user.password,
      });
    });
    
  } catch (error) {
    console.error("Error listing users:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed");
  }
}

// If an email is provided, find that user, otherwise list all users
if (process.argv[2]) {
  findUser(process.argv[2]);
} else {
  listAllUsers();
}
