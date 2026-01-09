const productModel = require('../models/product.model');
const { uploadImage, deleteImage } = require('../services/imagekit.service');
const mongoose = require('mongoose');

async function createProduct(req, res) {
    try {
        const { title, description, priceAmount, priceCurrency = 'INR' } = req.body;

        // ✅ SAFETY CHECK
        if (!req.user || !req.user.id) {
            return res.status(401).json({
                message: "Unauthorized: seller not found"
            });
        }
        const seller = req.user.id; // Extract seller from authenticated user

        const price = {
            amount: Number(priceAmount),
            currency: priceCurrency,
        };

        const images = await Promise.all((req.files || []).map(file => uploadImage({ buffer: file.buffer })));


        const product = await productModel.create({ title, description, price, seller, images });

    

        return res.status(201).json({
            message: 'Product created',
            data: product,
        });
    } catch (err) {
        console.error('Create product error', err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getProducts(req, res) {

    const { q, minprice, maxprice, skip = 0, limit = 20 } = req.query;


    const filter = {}

    if (q) {
        filter.$text = { $search: q }
    }

    if (minprice) {
        filter[ 'price.amount' ] = { ...filter[ 'price.amount' ], $gte: Number(minprice) }
    }

    if (maxprice) {
        filter[ 'price.amount' ] = { ...filter[ 'price.amount' ], $lte: Number(maxprice) }
    }

    const products = await productModel.find(filter).skip(Number(skip)).limit(Math.min(Number(limit), 20));

    return res.status(200).json({ data: products });

}

async  function getProductById(req, res) {
    try {
        const {id} = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const product = await productModel.findById(id);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        return res.status(200).json({ data: product });

    } catch (err) { 
        
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function updateProduct(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        // ensure we only find the product when it belongs to the authenticated seller
        const product = await productModel.findOne({
            _id: id,
            seller: req.user.id,
        });

        if(!product) {
            return res.status(404).json({ message: 'Product not found or you are not authorized to update this product' });
        }

        const allowedUpdates = [ 'title', 'description', 'price', 'stock' ];
        for (const key of Object.keys(req.body)) {
            if (allowedUpdates.includes(key)) {
                if (key === 'price' && typeof req.body.price === 'object') {
                    if (req.body.price.amount !== undefined) {
                        product.price.amount = Number(req.body.price.amount);
                    }
                    if (req.body.price.currency !== undefined) {
                        product.price.currency = req.body.price.currency;
                    }
                    if(req.body.stock !== undefined) {
                        product.stock = Number(req.body.stock);
                    }
                } else {
                    product[ key ] = req.body[ key ];
                }

            }
        }

        await product.save();
        return res.status(200).json({ message: 'Product updated', product });

    } catch (err) {
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function deleteProduct(req, res) {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid product ID' });
        }

        // 1️⃣ Find product first (DO NOT delete yet)
        const product = await productModel.findOne({
        _id: id,
        seller: req.user.id,
        });

        if (!product) {
        return res.status(404).json({
            message: 'Product not found or you are not authorized to delete this product'
        });
        }

        // 2️⃣ Delete images from ImageKit
        if (product.images && product.images.length > 0) {
        await Promise.all(
            product.images
            .filter(img => img.id)
            .map(img => deleteImage(img.id))
        );
        }

        // 3️⃣ Delete product from DB
        await product.deleteOne();

        return res.status(200).json({
        message: 'Product and images deleted successfully'
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}

async function getSellerProducts(req, res) {
    try {
        const sellerId = req.user?.id || req.user?._id;

        if (!sellerId) {
        return res.status(401).json({ message: 'Unauthorized: seller not found' });
        }

        const { skip = 0, limit = 20 } = req.query;

        const products = await productModel
        .find({ seller: sellerId })
        .skip(Number(skip))
        .limit(Math.min(Number(limit), 20))
        .sort({ createdAt: -1 }); // latest first (optional)

        return res.status(200).json({
        count: products.length,
        data: products,
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Internal server error' });
    }
}


module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct, getSellerProducts };