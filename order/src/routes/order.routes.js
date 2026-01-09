const express = require("express")
const createAuthMiddleware = require("../middlewares/auth.middleware")
const orderController = require("../controllers/order.controllers")
const validation = require("../middlewares/validator.middleware")


const router = express.Router()


router.post("/", createAuthMiddleware([ "user" ]), validation.createOrderValidation, orderController.createOrder)


router.get("/me", createAuthMiddleware([ "user" ]), orderController.getMyOrders)

router.get("/seller", createAuthMiddleware(["seller"]), orderController.getSellerOrders)

router.post("/:id/cancel", createAuthMiddleware([ "user" ]), orderController.cancelOrderById)

router.patch("/:id/address", createAuthMiddleware([ "user" ]), validation.updateAddressValidation, orderController.updateOrderAddress)

router.get("/:id", createAuthMiddleware([ "user", "admin" ]), orderController.getOrderById)



module.exports = router;