const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
            },
        }
    ]

}, { timestamps: true });


const cartModel = mongoose.model('Cart', cartSchema);

module.exports = cartModel;