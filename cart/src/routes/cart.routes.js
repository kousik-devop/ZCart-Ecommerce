const { addItemToCart, getCart, updateCartItemQuantity, deleteCartItem } = require("../controllers/cart.controllers");
const express = require("express");
const router = express.Router();
const createAuthMiddleware = require("../middlewares/auth.middleware");

const { validateAddItemToCart, validateUpdateCartItem } = require("../middlewares/validator.middleware");   


router.post("/items", createAuthMiddleware(["user"]), validateAddItemToCart, addItemToCart);

router.get("/", createAuthMiddleware(["user"]), getCart);

router.patch("/:productId", createAuthMiddleware(["user"]), validateUpdateCartItem, updateCartItemQuantity); 

router.delete("/:productId", createAuthMiddleware(["user"]), deleteCartItem);

module.exports = router;