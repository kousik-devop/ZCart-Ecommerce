const request = require('supertest');
const app = require('../app');
const User = require('../models/user.model');
const jwt = require('jsonwebtoken');

describe('POST /api/auth/users/me/addresses', () => {
  it('should add a new address for the authenticated user and return 201', async () => {
    const user = await User.create({
      username: 'addruser',
      email: 'addr@example.com',
      password: 'hashed',
      firstname: 'Addr',
      lastname: 'User'
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const addressPayload = {
      street: '123 Test St',
      city: 'Testville',
      state: 'TS',
      zipCode: '12345',
      country: 'Testland'
    };

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=${token}`)
      .send(addressPayload);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('address');

    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser.address).toHaveLength(1);
    expect(refreshedUser.address[0].street).toBe('123 Test St');
  });

  it('should return 400 when required address fields are missing', async () => {
    const user = await User.create({
      username: 'addruser2',
      email: 'addr2@example.com',
      password: 'hashed',
      firstname: 'Addr2',
      lastname: 'User2'
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const incompletePayload = {
      street: '123 Test St',
      // missing city, state, zipCode, country
    };

    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=${token}`)
      .send(incompletePayload);

    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .send({ street: 'x' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=invalidtoken`)
      .send({ street: 'x' });

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

});

describe('GET /api/auth/users/me/addresses', () => {
  it('should return addresses for authenticated user (200)', async () => {
    const user = await User.create({
      username: 'addrget1',
      email: 'addrget1@example.com',
      password: 'hashed',
      firstname: 'Addr',
      lastname: 'Get',
      address: [
        {
          street: '1 Test St',
          city: 'CityA',
          state: 'CA',
          zipCode: '11111',
          country: 'CountryA'
        }
      ]
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .get('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('addresses');
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses).toHaveLength(1);
    expect(res.body.addresses[0]).toHaveProperty('street', '1 Test St');
  });

  it('should return empty array when user has no addresses (200)', async () => {
    const user = await User.create({
      username: 'addrget2',
      email: 'addrget2@example.com',
      password: 'hashed',
      firstname: 'Addr2',
      lastname: 'Get2',
      address: []
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .get('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('addresses');
    expect(Array.isArray(res.body.addresses)).toBe(true);
    expect(res.body.addresses).toHaveLength(0);
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .get('/api/auth/users/me/addresses');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .get('/api/auth/users/me/addresses')
      .set('Cookie', `user_token=invalidtoken`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});

describe('DELETE /api/auth/users/me/addresses/:addressId', () => {
  it('should delete an address for authenticated user and return 200', async () => {
    const user = await User.create({
      username: 'addrdel1',
      email: 'addrdel1@example.com',
      password: 'hashed',
      firstname: 'Addr',
      lastname: 'Del',
      address: [
        {
          street: '9 Remove St',
          city: 'Removille',
          state: 'RM',
          zipCode: '99999',
          country: 'RemCountry'
        }
      ]
    });

    const addressId = user.address[0]._id;
    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .delete(`/api/auth/users/me/addresses/${addressId}`)
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('message');

    const refreshedUser = await User.findById(user._id);
    expect(refreshedUser.address).toHaveLength(0);
  });

  it('should return 404 when addressId not found', async () => {
    const user = await User.create({
      username: 'addrdel2',
      email: 'addrdel2@example.com',
      password: 'hashed',
      firstname: 'Addr2',
      lastname: 'Del2',
      address: []
    });

    const token = jwt.sign({ userId: user._id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: '7d' });

    const res = await request(app)
      .delete('/api/auth/users/me/addresses/000000000000000000000000')
      .set('Cookie', `user_token=${token}`);

    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when not authenticated', async () => {
    const res = await request(app)
      .delete('/api/auth/users/me/addresses/000000000000000000000000');

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });

  it('should return 401 when token is invalid', async () => {
    const res = await request(app)
      .delete('/api/auth/users/me/addresses/000000000000000000000000')
      .set('Cookie', `user_token=invalidtoken`);

    expect(res.statusCode).toBe(401);
    expect(res.body).toHaveProperty('message');
  });
});
