const mongoose = require('mongoose');
require('dotenv').config();

// Create connections to both databases
let conn1, conn2;

const connectDB = async () => {
  try {
    // No need to pass deprecated options anymore
    conn1 = await mongoose.createConnection(process.env.MONGODB_URI);
    console.log('✅ Primary MongoDB Connected');

    conn2 = await mongoose.createConnection(process.env.MONGODB_URI_SECONDARY);
    console.log('✅ Secondary MongoDB Connected');

    mongoose.connection = conn1;

    return { conn1, conn2 };
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = { connectDB, getConnections: () => ({ conn1, conn2 }) };
