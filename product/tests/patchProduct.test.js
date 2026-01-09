const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Product = require('../src/models/product.model');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

describe('PATCH /api/products/:id', () => {
  let sellerId;
  let otherSellerId;
  let sellerAuth;
  let otherAuth;

  beforeAll(() => {
    sellerId = new mongoose.Types.ObjectId().toHexString();
    otherSellerId = new mongoose.Types.ObjectId().toHexString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
    sellerAuth = `Bearer ${token}`;
    const token2 = jwt.sign({ id: otherSellerId, role: 'seller' }, process.env.JWT_SECRET);
    otherAuth = `Bearer ${token2}`;
  });

  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('updates allowed fields (title and price) for owner and returns 200', async () => {
    const product = await Product.create({
      title: 'Old Title',
      description: 'old',
      price: { amount: 10, currency: 'INR' },
      seller: sellerId,
    });

    const payload = {
      title: 'New Title',
      price: { amount: 99, currency: 'USD' },
    };

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', sellerAuth)
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Product updated');
    expect(res.body).toHaveProperty('product');
    const updated = res.body.product;
    expect(updated.title).toBe(payload.title);
    expect(updated.price.amount).toBe(Number(payload.price.amount));
    expect(updated.price.currency).toBe(payload.price.currency);
  });

  it('returns 400 for invalid product id', async () => {
    const res = await request(app)
      .patch('/api/products/invalid-id')
      .set('Authorization', sellerAuth)
      .send({ title: 'x' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Invalid product ID');
  });

  it('returns 404 when seller does not own the product', async () => {
    const product = await Product.create({
      title: 'Owned by A',
      price: { amount: 5, currency: 'INR' },
      seller: sellerId,
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', otherAuth)
      .send({ title: 'Hacked' });

    expect(res.status).toBe(404);
    expect(res.body).toHaveProperty('message', 'Product not found or you are not authorized to update this product');
  });

  it('returns 401 when no authentication is provided', async () => {
    const product = await Product.create({
      title: 'No Auth',
      price: { amount: 1, currency: 'INR' },
      seller: sellerId,
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .send({ title: 'Trying' });

    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('message', 'Authentication required');
  });

  it('ignores updates to non-allowed fields (seller) and does not change ownership', async () => {
    const product = await Product.create({
      title: 'Immutable Seller',
      price: { amount: 20, currency: 'INR' },
      seller: sellerId,
    });

    const res = await request(app)
      .patch(`/api/products/${product._id}`)
      .set('Authorization', sellerAuth)
      .send({ seller: otherSellerId, title: 'Still Allowed' });

    expect(res.status).toBe(200);
    const updated = res.body.product;
    expect(updated.title).toBe('Still Allowed');
    expect(updated.seller.toString()).toBe(sellerId.toString());
  });
});
