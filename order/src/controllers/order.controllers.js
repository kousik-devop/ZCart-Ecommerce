// const { promises } = require("supertest/lib/test");
const orderModel = require("../models/order.model");
const { publishToQueue } = require("../broker/broker");
const axios = require("axios");

const CART_SERVICE_URL = process.env.CART_SERVICE_URL;
const PRODUCT_SERVICE_URL = process.env.PRODUCT_SERVICE_URL;


async function createOrder(req, res) {

    const user = req.user;
    const token = req.cookies?.user_token || req.headers?.authorization?.split(' ')[ 1 ];

    try {

        // fetch user cart from cart service
        let cartResponse;
        try {
            cartResponse = await axios.get(`${CART_SERVICE_URL}/api/cart`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });
        } catch (err) {
            // If the cart service responded with a status, forward it
            if (err.response) {
                const status = err.response.status || 502;
                const data = err.response.data || { message: 'Upstream cart service error' };
                return res.status(status).json({ message: data.message || 'Upstream cart service error', error: data });
            }
            return res.status(502).json({ message: 'Unable to reach cart service', error: err.message });
        }

        // fetch product details; if any fetch fails, return that upstream status
        let products;
        try {
            products = await Promise.all(cartResponse.data.cart.items.map(async (item) => {
                const resp = await axios.get(`${PRODUCT_SERVICE_URL}/api/products/${item.productId}`, {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                });
                return resp.data.data;
            }));
        } catch (err) {
            if (err.response) {
                const status = err.response.status || 502;
                const data = err.response.data || { message: 'Upstream product service error' };
                return res.status(status).json({ message: data.message || 'Upstream product service error', error: data });
            }
            return res.status(502).json({ message: 'Unable to reach product service', error: err.message });
        }

        let priceAmount = 0;

        const orderItems = cartResponse.data.cart.items.map((item, index) => {


            const product = products.find(p => p._id === item.productId)

            // if not in stock, does not allow order creation

            if (product.stock < item.quantity) {
                throw new Error(`Product ${product.title} is out of stock or insufficient stock`)
            }

            const itemTotal = product.price.amount * item.quantity;
            priceAmount += itemTotal;

            return {
                product: item.productId,
                quantity: item.quantity,
                price: {
                    amount: itemTotal,
                    currency: product.price.currency
                }
            }
        })

        const order = await orderModel.create({
            user: user.id || user.userId || user.userId,
            items: orderItems,
            status: "PENDING",
            totalPrice: {
                amount: priceAmount,
                currency: "INR" // assuming all products are in USD for simplicity
            },
            shippingAddress: {
                street: req.body.shippingAddress.street,
                city: req.body.shippingAddress.city,
                state: req.body.shippingAddress.state,
                zip: req.body.shippingAddress.pincode,
                country: req.body.shippingAddress.country,
            }
        })


        await publishToQueue("ORDER_SELLER_DASHBOARD.ORDER_CREATED", order)

        res.status(201).json({ order })

    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }

}

async function getMyOrders(req, res) {
    const user = req.user;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        const orders = await orderModel.find({ user: user.userId }).skip(skip).limit(limit).exec();
        const totalOrders = await orderModel.countDocuments({ user: user.userId });

        res.status(200).json({
            orders,
            meta: {
                total: totalOrders,
                page,
                limit
            }
        })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function getOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.userId) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        res.status(200).json({ order })
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message })
    }
}

async function cancelOrderById(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.userId) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        // only PENDING orders can be cancelled
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order cannot be cancelled at this stage" });
        }

        order.status = "CANCELLED";
        await order.save();

        res.status(200).json({ order });
    } catch (err) {

        console.error(err);

        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}


async function updateOrderAddress(req, res) {
    const user = req.user;
    const orderId = req.params.id;

    try {
        const order = await orderModel.findById(orderId)

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        if (order.user.toString() !== user.userId) {
            return res.status(403).json({ message: "Forbidden: You do not have access to this order" });
        }

        // only PENDING orders can have address updated
        if (order.status !== "PENDING") {
            return res.status(409).json({ message: "Order address cannot be updated at this stage" });
        }

        order.shippingAddress = {
            street: req.body.shippingAddress.street,
            city: req.body.shippingAddress.city,
            state: req.body.shippingAddress.state,
            zip: req.body.shippingAddress.pincode,
            country: req.body.shippingAddress.country,
        };

        await order.save();

        res.status(200).json({ order });
    } catch (err) {
        res.status(500).json({ message: "Internal server error", error: err.message });
    }
}


async function getSellerOrders(req, res) {

    const user = req.user;
   
    const token = req.cookies?.user_token || req.headers?.authorization?.split(" ")[1];

    try {
        // 1️⃣ Get seller's products from Product Service
        let productResponse;
        try {
            productResponse = await axios.get(
                "http://localhost:3001/api/products/",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );
        } catch (err) {
            return res.status(502).json({
                message: "Unable to fetch seller products",
                error: err.response?.data || err.message
            });
        }

        const products =
            productResponse.data.products ||
            productResponse.data.data ||
            productResponse.data;

        if (!Array.isArray(products)) {
            return res.status(500).json({
                message: "Invalid product service response format",
                error: productResponse.data
            });
        }

        const sellerProductIds = products.map(p => p._id);


        // 2️⃣ Find orders containing seller's products
        const orders = await orderModel.find({
            "items.product": { $in: sellerProductIds }
        }).lean();

        // 3️⃣ Return only seller-specific items
        const sellerOrders = orders.map(order => ({
            _id: order._id,
            status: order.status,
            createdAt: order.createdAt,
            items: order.items.filter(item =>
                sellerProductIds.includes(item.product.toString())
            )
        }));

        res.status(200).json({ orders: sellerOrders });

    } catch (err) {
        res.status(500).json({
            message: "Internal server error",
            error: err.message
        });
    }
}


module.exports = {
    createOrder,
    getMyOrders,
    getOrderById,
    cancelOrderById,
    updateOrderAddress,
    getSellerOrders
}