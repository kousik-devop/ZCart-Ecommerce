const express = require('express');
const { register, login, getCurrentUser, logoutUser, addAddress, getUserAddresses, deleteAddress} = require('../controllers/auth.controller');
const {userRegistrationValidator, userLoginValidator, addressValidator, respondWithValidationErrors} = require('../middlewares/validator.middleware');
const authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();

router.post('/register', userRegistrationValidator, respondWithValidationErrors, register);
router.post('/login', userLoginValidator, respondWithValidationErrors, login);
router.get('/me',authMiddleware, getCurrentUser);
router.get('/logout', logoutUser);

router.post('/users/me/addresses', authMiddleware, addressValidator, respondWithValidationErrors, addAddress);
router.get('/users/me/addresses', authMiddleware, getUserAddresses);
router.delete('/users/me/addresses/:addressId', authMiddleware, deleteAddress);


module.exports = router;
