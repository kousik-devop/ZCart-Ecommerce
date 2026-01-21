const mongoose = require("mongoose");
const User = require('../models/user.model');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const redis = require('../db/redis');
const { publishToQueue } = require('../broker/broker');

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: false,
    sameSite: 'none',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

const register = async (req, res) => {
    try {
        const { username, email, password, firstname, lastname, role } = req.body;

        if (!username || !email || !password || !firstname || !lastname) {
            return res.status(400).json({ message: 'All fields are required' });
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
            {
                userId: newUser._id,
                username: newUser.username,
                role: newUser.role,
                email: newUser.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('user_token', token, COOKIE_OPTIONS);

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
                fullname: `${newUser.firstname} ${newUser.lastname}`,
                role: newUser.role
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const login = async (req, res) => {
    try {
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
            {
                userId: user._id,
                username: user.username,
                role: user.role,
                email: user.email
            },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        res.cookie('user_token', token, COOKIE_OPTIONS);

        return res.status(200).json({
            message: 'Login successful',
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                fullname: `${user.firstname} ${user.lastname}`,
                role: user.role,
                address: user.address
            }
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getCurrentUser = async (req, res) => {
    return res.status(200).json({
        message: 'Current user fetched successfully',
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email,
            fullname: `${req.user.firstname} ${req.user.lastname}`,
            role: req.user.role,
            address: req.user.address
        }
    });
};

const logoutUser = async (req, res) => {
    try {
        const token = req.cookies.user_token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        try {
            jwt.verify(token, process.env.JWT_SECRET);
        } catch {
            return res.status(401).json({ message: 'Invalid token' });
        }

        await redis.set(`bl_${token}`, token, 'EX', 7 * 24 * 60 * 60);

        res.clearCookie('user_token', {
            httpOnly: true,
            secure: false,
            sameSite: 'none',
            path: '/'
        });

        return res.status(200).json({ message: 'Logout successful' });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const addAddress = async (req, res) => {
    try {
        const { street, city, state, zipCode, country } = req.body;

        if (!street || !city || !state || !zipCode || !country) {
            return res.status(400).json({ message: 'All address fields are required' });
        }

        const newAddress = { street, city, state, zipCode, country };
        req.user.address.push(newAddress);
        await req.user.save();

        return res.status(201).json({
            message: 'Address added successfully',
            address: newAddress
        });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

const getUserAddresses = async (req, res) => {
    return res.status(200).json({
        message: 'User addresses fetched successfully',
        addresses: req.user.address
    });
};

const deleteAddress = async (req, res) => {
    try {
        const { addressId } = req.params;

        const existing = req.user.address.find(
            a => a._id && a._id.toString() === addressId
        );

        if (!existing) {
            return res.status(404).json({ message: 'Address not found' });
        }

        req.user.address = req.user.address.filter(
            a => !(a._id && a._id.toString() === addressId)
        );

        await req.user.save();

        return res.status(200).json({ message: 'Address deleted successfully' });

    } catch (error) {
        return res.status(500).json({ message: 'Internal server error' });
    }
};

module.exports = {
    register,
    login,
    getCurrentUser,
    logoutUser,
    addAddress,
    getUserAddresses,
    deleteAddress
};
