process.env.JWT_SECRET = '85da2042e17892c8d3f64e8c0f302bb8f3cd2de91a6d31d95607d153e3a65566';

const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = async () => {};

beforeAll(async () => {
  try {
    console.log('Starting MongoMemoryServer for tests...');
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('MongoMemoryServer URI:', uri);
    await mongoose.connect(uri);
    console.log('Connected mongoose to in-memory MongoDB');
  } catch (err) {
    console.error('Error in test setup beforeAll:', err);
    throw err;
  }
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) await mongoServer.stop();
});