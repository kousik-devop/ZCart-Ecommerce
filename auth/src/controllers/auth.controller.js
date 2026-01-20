const mongoose = require("mongoose");
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const { publishToQueue } = require('../broker/broker');

const register = async (req, res) => {
    try {
        const { username, email, password, firstname, lastname, role } = req.body;

        // ✅ matches test expectation
        if (!username || !email || !password || !firstname || !lastname ) {
        return res.status(400).json({
            message: 'All fields are required'
        });
        }

        const isExistingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (isExistingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await User.create({
            username,
            email,
            password: hashedPassword,
            firstname,
            lastname,
            role: role || 'user'
        });

        await Promise.all([
            publishToQueue('AUTH_NOTIFICATION.USER_CREATED', {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                firstname: newUser.firstname,
                lastname: newUser.lastname,
                role: newUser.role,
            }),
            publishToQueue("AUTH_SELLER_DASHBOARD.USER_CREATED", newUser)
        ]);

        const token = jwt.sign(
            { userId: newUser._id, username: newUser.username, role: newUser.role, email: newUser.email},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('user_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                fullname: newUser.firstname + ' ' + newUser.lastname,
                role: newUser.role
            }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const login = async (req, res) => {
    try{
        const { email, password } = req.body;
        
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { userId: user._id, username: user.username, role: user.role, email: user.email},
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('user_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return res.status(200).json({ message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: user.firstname + ' ' + user.lastname,
                role: user.role,
                address: user.address
            }
         });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        message: 'Current user fetched successfully',
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            fullname: req.user.firstname + ' ' + req.user.lastname,
            role: req.user.role,
            address: req.user.address
        }
    })
}

const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.user_token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (err) {
            // ✅ THIS fixes the test
            return res.status(401).json({ message: 'Invalid token' });
        }

        // Block the token in Redis
        await redis.set(`bl_${token}`, token, 'EX', 7 * 24 * 60 * 60); // Block for 7 days

        res.clearCookie('user_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        });

        return res.status(200).json({ message: 'Logout successful' });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const addAddress = async (req, res) => {
    try {
        const { street, city, state, zipCode, country } = req.body;

        if (!street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ message: 'All address fields are required' });
        }
        
        const newAddress = {
            street,
            city,
            state,
            zipCode,
            country
        };

        // Add address to user's addresses array

        req.user.address.push(newAddress);
        await req.user.save();

        return res.status(201).json({ message: 'Address added successfully', address: newAddress });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

const getUserAddresses = async (req, res) => {
    try {
        return res.status(200).json({
            message: 'User addresses fetched successfully',
            addresses: req.user.address
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}

async function deleteAddress(req, res) {
    try {
        const { addressId } = req.params;
        console.log('deleteAddress called', { userId: req.user && req.user._id ? req.user._id.toString() : null, addressId, addressCount: Array.isArray(req.user.address) ? req.user.address.length : typeof req.user.address });

        // Use filtering to remove the address to avoid issues with subdoc methods
        const existing = req.user.address.find(a => a._id && a._id.toString() === addressId);
        console.log('deleteAddress found existing', !!existing, existing && existing._id ? existing._id.toString() : null);
        if (!existing) {
            return res.status(404).json({ message: 'Address not found' });
        }

        req.user.address = req.user.address.filter(a => !(a._id && a._id.toString() === addressId));
        console.log('deleteAddress after filter addressCount', Array.isArray(req.user.address) ? req.user.address.length : typeof req.user.address);
        await req.user.save();
        console.log('deleteAddress after save');

        return res.status(200).json({ message: 'Address deleted successfully' });
    } catch (error) {
        console.error('deleteAddress error', error);
        return res.status(500).json({ message: 'Internal server error', error: error.message });
    }
}



module.exports = { register, login, getCurrentUser, logoutUser, addAddress, getUserAddresses, deleteAddress };