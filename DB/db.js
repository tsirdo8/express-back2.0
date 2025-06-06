const mongoose = require('mongoose');
require('dotenv').config();

const connectToDB = async () => {
  try {
    // Connection configuration
    const options = {
      
      serverSelectionTimeoutMS: 5000, // 5s timeout for initial connection
      socketTimeoutMS: 30000, // 30s timeout for queries
      maxPoolSize: 10, // Max connections in pool
      retryWrites: true,
      w: 'majority',
    };

    await mongoose.connect(process.env.MONGO_URL, options);

    console.log('✅ MongoDB connected successfully');

    // Log connection events (optional but helpful for debugging)
    mongoose.connection.on('connected', () => {
      console.log('Mongoose connected to DB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('Mongoose disconnected from DB');
    });

    // Close connection on app termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
    // Exit process if DB connection fails (critical for production)
    process.exit(1);
  }
};

module.exports = connectToDB;