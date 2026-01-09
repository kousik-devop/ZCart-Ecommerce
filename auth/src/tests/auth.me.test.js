const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('GET /api/auth/me', () => {
  it('should return current user info when provided valid token cookie', async () => {
    const user = await User.create({
      username: 'meuser',
      email: 'me@example.com',
      password: 'hashed',
      firstname: 'Me',
      lastname: 'User'
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('user');
    expect(res.body.user).toHaveProperty('id');
    expect(res.body.user).toHaveProperty('username', 'meuser');
    expect(res.body.user).toHaveProperty('email', 'me@example.com');
  });

  it('should return 401 when no auth cookie is present', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `user_token=invalidtoken`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is valid but user does not exist', async () => {
    const fakeId = '000000000000000000000000';
    const token = jwt.sign({ userId: fakeId, username: 'ghost', role: 'user' }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .get('/api/auth/me')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
