process.env.JWT_SECRET = process.env.JWT_SECRET || 'testsecret';

const request = require('supertest');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const app = require('../src/app');
const { startTestDB, stopTestDB } = require('./setup');

let token;
let userId;

beforeAll(async () => {
  await startTestDB();
  userId = new mongoose.Types.ObjectId();
  token = jwt.sign({ _id: userId.toHexString(), role: 'user' }, process.env.JWT_SECRET);
});

afterAll(async () => {
  await stopTestDB();
});

describe('POST /api/cart/items', () => {
  test('should add an item to the cart and return 200', async () => {
    const productId = new mongoose.Types.ObjectId();
    const payload = { productId: productId.toHexString(), quantity: 2, qty: 2 };

    const res = await request(app)
      .post('/api/cart/items')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(res.body).toHaveProperty('_id');
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toBe(userId.toHexString());
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items[0].productId).toBe(productId.toHexString());
    expect(res.body.items[0].quantity).toBe(payload.quantity);
  });

  test('should return 401 when no token provided', async () => {
    const productId = new mongoose.Types.ObjectId();
    const payload = { productId: productId.toHexString(), quantity: 1, qty: 1 };

    await request(app).post('/api/cart/items').send(payload).expect(401);
  });
});
