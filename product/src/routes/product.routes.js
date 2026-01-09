const express = require('express');
const { createAuthMiddleware } = require('../middlewares/auth.middleware');
const {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  getSellerProducts,
} = require('../controllers/product.controller');
const { createProductValidators } = require('../middlewares/validator.middleware');
const multer = require('multer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

/* POST /api/products */
router.post(
  '/',
  createAuthMiddleware(['seller', 'admin']),
  upload.array('images', 5),
  createProductValidators,
  createProduct
);

/* GET /api/products */
router.get('/', getProducts);

/* ✅ STATIC ROUTES FIRST */
router.get(
  '/seller',
  createAuthMiddleware(['seller']),
  getSellerProducts
);

/* ✅ DYNAMIC ROUTES LAST */
router.get('/:id', getProductById);

router.patch(
  '/:id',
  createAuthMiddleware(['seller']),
  updateProduct
);

router.delete(
  '/:id',
  createAuthMiddleware(['seller']),
  deleteProduct
);

module.exports = router;
