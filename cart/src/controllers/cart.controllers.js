const cartModel = require("../models/cart.model");

async function addItemToCart(req, res) {
    try {

        const { productId, qty } = req.body;

        const quantity = Number(qty);
        if (!Number.isInteger(quantity) || quantity <= 0 || Number.isNaN(quantity)) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const user = req.user;
        const userId = (user && (user.userId || user._id || user.id))?.toString();

        let cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            cart = new cartModel({ user: userId, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);

        if (existingItemIndex >= 0) {
            const current = Number(cart.items[ existingItemIndex ].quantity) || 0;
            cart.items[ existingItemIndex ].quantity = current + quantity;
        } else {
            cart.items.push({ productId, quantity });
        }

        await cart.save();

        res.status(200).json(cart);


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function getCart(req, res) {
    try {

         const user = req.user;
        const userId = (user && (user.userId || user._id || user.id))?.toString();

        let cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            cart = new cartModel({ user: userId, items: [] });
            await cart.save();
        }

        res.status(200).json({
            cart,
            totals: {
                itemCount: cart.items.length,
                totalQuantity: cart.items.reduce((sum, item) => sum + item.quantity, 0)
            }
        });


    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function updateCartItemQuantity(req, res) {
    try {

        const { productId } = req.params;
        const { qty } = req.body;
        const quantity = Number(qty);
        if (!Number.isInteger(quantity) || quantity <= 0 || Number.isNaN(quantity)) {
            return res.status(400).json({ message: 'Invalid quantity' });
        }

        const user = req.user;
        const userId = (user && (user.userId || user._id || user.id))?.toString();

        const cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        
        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (existingItemIndex < 0) {
            return res.status(404).json({ message: 'Item not found' });
        }
        cart.items[ existingItemIndex ].quantity = quantity;
        await cart.save();
        res.status(200).json(cart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

async function deleteCartItem(req, res) {
    try {
        const { productId } = req.params;

        const user = req.user;
        const userId = (user && (user.userId || user._id || user.id))?.toString();
        const cart = await cartModel.findOne({ user: userId });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        const existingItemIndex = cart.items.findIndex(item => item.productId.toString() === productId);
        if (existingItemIndex < 0) {
            return res.status(404).json({ message: 'Item not found' });
        }

        cart.items.splice(existingItemIndex, 1);
        await cart.save();
        res.status(200).json(cart);

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}


module.exports = { addItemToCart, getCart, updateCartItemQuantity, deleteCartItem };