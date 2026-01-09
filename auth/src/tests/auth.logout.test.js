// Mock Redis before importing app/controller so controller uses the mocked client
jest.mock('../db/redis', () => ({
  set: jest.fn(),
  on: jest.fn(),
}));

const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');

beforeEach(() => {
  jest.clearAllMocks();
});

describe('GET /api/auth/logout', () => {
  it('should block token in redis and clear cookie when token cookie is present', async () => {
    const user = await User.create({
      username: 'logoutuser',
      email: 'logout@example.com',
      password: 'hashed',
      firstname: 'Logout',
      lastname: 'User'
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');

    // Redis set should be called to block the token
    expect(redis.set).toHaveBeenCalled();
    const firstArg = redis.set.mock.calls[0][0];
    expect(typeof firstArg).toBe('string');

    // Cookie cleared
    expect(res.headers['set-cookie']).toBeDefined();
    const cookieJoined = Array.isArray(res.headers['set-cookie']) ? res.headers['set-cookie'].join(';') : res.headers['set-cookie'];
    expect(cookieJoined).toMatch(/user_token=;|user_token=""/);
  });

  it('should return 401 when no token cookie is present', async () => {
    const res = await request(app)
      .get('/api/auth/logout');

    expect(res.statusCode).toBe(401);
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/logout')
      .set('Cookie', `user_token=invalidtoken`);

    expect(res.statusCode).toBe(401);
    expect(redis.set).not.toHaveBeenCalled();
  });
});
