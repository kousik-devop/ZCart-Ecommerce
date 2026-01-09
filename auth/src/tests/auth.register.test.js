const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const User = require('../models/user.model');

describe('POST /api/auth/register', () => {
  it('should register a new user and return 201', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'johndoe',
        email: 'john@example.com',
        password: 'password123',
        firstname: 'John', 
        lastname: 'Doe'
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message', 'User registered successfully');

    const user = await User.findOne({ email: 'john@example.com' });
    expect(user).not.toBeNull();
    expect(user.username).toBe('johndoe');
  });

  it('should return 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'janedoe',
        email: 'jane@example.com'
        // missing password and fullname
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'All fields are required');
  });

  it('should return 400 when email already exists', async () => {
    // create existing user
    await User.create({
      username: 'existing',
      email: 'exist@example.com',
      password: 'hashed',
      firstname: 'Exist', 
      lastname: 'User'
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        username: 'newuser',
        email: 'exist@example.com',
        password: 'password123',
        firstname: 'New', 
        lastname: 'User'
      });

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message', 'User already exists');
  });
});