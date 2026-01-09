const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

// allow more time for mongodb-memory-server to start on slow machines
jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  // set test JWT secret for auth middleware
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
});

afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    try {
      await collection.deleteMany({});
    } catch (err) {
      // ignore
    }
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});