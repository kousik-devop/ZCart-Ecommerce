const mongoose = require('mongoose');

const DB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ZCart_Auth';

async function connectToDatabase() {
  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
  }
}

module.exports = { connectToDatabase };