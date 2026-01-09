const request = require('supertest');
const express = require('express');
const { createProductValidators } = require('../src/middlewares/validator.middleware');

// small app that uses the validators
const app = express();
app.use(express.json());
app.post('/validate', createProductValidators, (req, res) => res.status(200).json({ ok: true }));

describe('Validator middleware normalized response', () => {
  it('returns standardized error objects without `path` and with optional `value`', async () => {
    const res = await request(app).post('/validate').send({ title: '', priceCurrency: 'USD' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('message', 'Validation error');
    expect(Array.isArray(res.body.errors)).toBe(true);

    // every error object should have type, msg, location
    res.body.errors.forEach(e => {
      expect(e).toHaveProperty('type', 'field');
      expect(e).toHaveProperty('msg');
      expect(e).toHaveProperty('location', 'body');
      // must NOT have 'path'
      expect(e).not.toHaveProperty('path');
    });

    // Should include title required error with value === ''
    expect(res.body.errors.some(e => e.msg === 'title is required' && e.value === '')).toBe(true);

    // Should include priceAmount required error
    expect(res.body.errors.some(e => e.msg === 'priceAmount is required')).toBe(true);
  });
});
