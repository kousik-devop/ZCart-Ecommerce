const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

module.exports = {
  async connect() {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    console.log('TEST MONGO URI:', uri);
    await mongoose.connect(uri);
  },

  async closeDatabase() {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    if (mongoServer) await mongoServer.stop();
  },

  async clearDatabase() {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      try {
        await collection.deleteMany();
      } catch (err) {
        // ignore
      }
    }
  }
};
