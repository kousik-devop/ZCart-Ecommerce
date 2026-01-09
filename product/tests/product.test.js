const request = require('supertest');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const Product = require('../src/models/product.model');

// ensure test secret is defined before creating tokens
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_jwt_secret';

// Shared test setup is in `tests/setup/setup.js` (starts/stops an in-memory MongoDB and clears collections).

describe('POST /api/products', () => {
  let authHeader;
  let sellerId;
  beforeAll(() => {
    sellerId = new mongoose.Types.ObjectId().toHexString();
    const token = jwt.sign({ id: sellerId, role: 'seller' }, process.env.JWT_SECRET);
    authHeader = `Bearer ${token}`;
    // quick sanity check that the token verifies with the current secret
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      // attach decoded for easier debugging if needed
      authHeader.decoded = decoded;
    } catch (err) {
      // surface helpful error during tests
      // eslint-disable-next-line no-console
      console.error('Token verification failed in test setup:', err.message);
    }
  });
  it('creates a product with valid payload and returns 201', async () => {
    const payload = {
      title: 'Test Product',
      description: 'A product',
      priceAmount: 100,
      priceCurrency: 'USD'
    };

    const res = await request(app).post('/api/products').set('Authorization', authHeader).send(payload);
    if (res.status !== 201) {
      // eslint-disable-next-line no-console
      console.log('DEBUG AUTH RESPONSE:', res.status, res.body);
    }

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('message', 'Product created');
    expect(res.body).toHaveProperty('data');
    const data = res.body.data;
    expect(data).toHaveProperty('_id');
    expect(data.title).toBe(payload.title);
    expect(data.price.amount).toBe(Number(payload.priceAmount));
    expect(data.price.currency).toBe(payload.priceCurrency);
    expect(data.seller.toString()).toBe(sellerId.toString());
  });

  it('defaults currency to INR when not provided', async () => {
    const payload = {
      title: 'No Currency',
      priceAmount: 50,
    };

    const res = await request(app).post('/api/products').set('Authorization', authHeader).send(payload);

    expect(res.status).toBe(201);
    const data = res.body.data;
    expect(data.price.currency).toBe('INR');
  });

  it('returns 400 when required fields are missing', async () => {
    const payload = {
      description: 'Missing title and priceAmount'
    };

    const res = await request(app).post('/api/products').set('Authorization', authHeader).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation error');
    expect(Array.isArray(res.body.errors)).toBe(true);
    // Should include title and priceAmount required messages
    expect(res.body.errors.some(e => e.msg === 'title is required')).toBe(true);
    expect(res.body.errors.some(e => e.msg === 'priceAmount is required')).toBe(true);
  });

  it('returns 400 for invalid currency enum', async () => {
    const payload = {
      title: 'Bad Currency',
      priceAmount: 10,
      priceCurrency: 'EUR'
    };

    const res = await request(app).post('/api/products').set('Authorization', authHeader).send(payload);

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation error');
    expect(res.body.errors.some(e => e.msg === 'priceCurrency must be USD or INR')).toBe(true);
  });
});
