const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // اتصال به دیتابیس موقت محلی بدون نیاز به شبکه و اینترنت
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    
    await mongoose.connect(uri);
    console.log('--- DB CONNECTED LOCALLY (MEMORY SERVER) ---');
  } catch (error) {
    // در صورت عدم وجود پکیج، اتصال مستقیم به پورت لوکال
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/lsm_db');
      console.log('--- DB CONNECTED TO LOCALHOST ---');
    } catch (err) {
      console.error('Database Error:', err.message);
    }
  }
};

module.exports = connectDB;