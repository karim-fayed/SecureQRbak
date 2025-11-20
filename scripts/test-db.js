import dotenv from 'dotenv';
import mongoose from 'mongoose'; // أضفنا هذا السطر لاستيراد mongoose

dotenv.config(); // لتحميل المتغيرات من .env.local

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("❌ MONGODB_URI is not defined in .env.local");
  process.exit(1);
} else {
  console.log("✅ MONGODB_URI is correctly defined");
}

mongoose.connect(uri)
  .then(() => {
    console.log("✅ Connected to MongoDB successfully");
    process.exit(0);
  })
  .catch(err => {
    console.error("❌ Failed to connect:", err);
    process.exit(1);
  });
