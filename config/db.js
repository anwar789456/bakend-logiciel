const mongoose = require('mongoose');
require('dotenv').config();

// Create connection to the secondary database only
let conn2;

const connectDB = async () => {
  try {
    // Connect only to the secondary database
    conn2 = await mongoose.createConnection(process.env.MONGODB_URI_SECONDARY);
    console.log('✅ MongoDB Connected (using secondary connection)');

    // Set as default connection
    mongoose.connection = conn2;

    return { conn2 };
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, getConnections: () => ({ conn2 }) };
