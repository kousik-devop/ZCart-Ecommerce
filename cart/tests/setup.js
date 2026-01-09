const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

async function startTestDB() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();

  await mongoose.connect(uri); // ✅ NO deprecated options
  return mongoose;
}

async function stopTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }
}

function createCartItemModel() {
  const CartItemSchema = new mongoose.Schema(
    {
      productId: { type: String, required: true },
      quantity: { type: Number, default: 1 },
      price: { type: Number, default: 0 }
    },
    { timestamps: true }
  );

  // ✅ Prevent model overwrite error in tests
  return mongoose.models.CartItemTest ||
    mongoose.model('CartItemTest', CartItemSchema);
}

module.exports = {
  startTestDB,
  stopTestDB,
  createCartItemModel
};
