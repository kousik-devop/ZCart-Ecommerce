const setupTestDB = require('../setup');
const axios = require('axios');

// Start in-memory MongoDB and connect mongoose before any tests
beforeAll(async () => {
  jest.setTimeout(20000);
  await setupTestDB.connect();
});

// Clear DB between tests
beforeEach(async () => {
  await setupTestDB.clearDatabase();
});

// Close DB after all tests
afterAll(async () => {
  await setupTestDB.closeDatabase();
});

// Global axios.get mock to simulate cart and product services
jest.spyOn(axios, 'get').mockImplementation(async (url, opts) => {
  // Simple mock routing based on URL
  if (typeof url === 'string' && url.includes('/api/cart')) {
    return {
      data: {
        cart: {
          items: [
            { productId: '507f1f77bcf86cd799439021', quantity: 1 }
          ],
          taxes: 0,
          shipping: 0
        }
      }
    };
  }

  const prodMatch = typeof url === 'string' && url.match(/\/api\/products\/(.+)$/);
  if (prodMatch) {
    const id = prodMatch[1];
    return {
      data: {
        data: {
          _id: id,
          title: 'Sample Product',
          price: { amount: 100, currency: 'USD' },
          stock: 10
        }
      }
    };
  }

  // Default fallback mock
  return { data: {} };
});
