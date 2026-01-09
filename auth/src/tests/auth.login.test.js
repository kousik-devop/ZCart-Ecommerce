const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');

describe('POST /api/auth/login', () => {
  it('should login an existing user and set cookie, returning 200', async () => {
    const password = 'password123';
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username: 'johndoe',
      email: 'john@example.com',
      password: hashed,
      firstname: 'John',
      lastname: 'Doe'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com', password });

    expect(res.statusCode).toBe(200);
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieJoined = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'].join(';') : res.headers['set-cookie'];
    expect(cookieJoined).toMatch(/user_token=/);
    expect(res.body).toHaveProperty('message', 'Login successful');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'john@example.com' });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'All fields are required');
  });

  it('should return 401 when credentials are invalid', async () => {
    const password = 'password123';
    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      username: 'janedoe',
      email: 'jane@example.com',
      password: hashed,
      firstname: 'Jane',
      lastname: 'Doe'
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'jane@example.com', password: 'wrongpass' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });

  it('should return 401 when user does not exist', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'noone@example.com', password: 'whatever' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message', 'Invalid credentials');
  });
});
