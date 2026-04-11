const mongoose = require('mongoose');

const DEFAULT_URI = 'mongodb://127.0.0.1:27017/binaryhub';

/**
 * Connects this app’s Mongoose instance to the database URI in env.
 * Use the same MONGODB_URI in admin-panel to share one database.
 */
function connectDatabase() {
  const uri = process.env.MONGODB_URI || DEFAULT_URI;
  return mongoose.connect(uri).catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });
}

module.exports = { connectDatabase, DEFAULT_URI };
