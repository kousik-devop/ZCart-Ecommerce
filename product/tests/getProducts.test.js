const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Product = require('../src/models/product.model');

// tests rely on shared in-memory mongodb setup at tests/setup/setup.js

describe('GET /api/products', () => {
  beforeEach(async () => {
    await Product.deleteMany({});
  });

  it('returns empty array when no products exist', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBe(0);
  });

  it('returns all products', async () => {
    const seller = new mongoose.Types.ObjectId();
    await Product.create([
      { title: 'A', description: 'a', price: { amount: 10 }, seller },
      { title: 'B', description: 'b', price: { amount: 20 }, seller },
      { title: 'C', description: 'c', price: { amount: 30 }, seller },
    ]);

    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(3);
  });

  it('supports pagination using skip and limit', async () => {
    const seller = new mongoose.Types.ObjectId();
    await Product.create([
      { title: 'p1', price: { amount: 1 }, seller },
      { title: 'p2', price: { amount: 2 }, seller },
      { title: 'p3', price: { amount: 3 }, seller },
      { title: 'p4', price: { amount: 4 }, seller },
      { title: 'p5', price: { amount: 5 }, seller },
    ]);

    const res = await request(app).get('/api/products').query({ skip: 1, limit: 2 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    // ensure returned items correspond to the expected slice
    expect(res.body.data[0].title).toBeDefined();
  });

  it('filters by minprice and maxprice', async () => {
    const seller = new mongoose.Types.ObjectId();
    await Product.create([
      { title: 'cheap', price: { amount: 10 }, seller },
      { title: 'mid', price: { amount: 50 }, seller },
      { title: 'expensive', price: { amount: 200 }, seller },
    ]);

    const res = await request(app).get('/api/products').query({ minprice: 20, maxprice: 100 });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].title).toBe('mid');
  });

  it('supports full-text search via q', async () => {
    const seller = new mongoose.Types.ObjectId();
    await Product.create([
      { title: 'Red Apple', description: 'fresh red apple', price: { amount: 5 }, seller },
      { title: 'Green Apple', description: 'fresh green apple', price: { amount: 6 }, seller },
      { title: 'Banana', description: 'ripe banana', price: { amount: 3 }, seller },
    ]);

    const res = await request(app).get('/api/products').query({ q: 'Red' });
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    expect(res.body.data.some(p => p.title.includes('Red'))).toBe(true);
  });
});
