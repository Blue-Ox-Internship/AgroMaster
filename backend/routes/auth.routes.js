const express = require('express');
const jwt = require('jsonwebtoken');
const { authenticate } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { full_name, email, phone, business_name, password, role } = req.body;

        // Validate required fields
        if (!full_name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide full name, email, and password'
            });
        }

        // Check if user exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                status: 'error',
                message: 'Email already registered'
            });
        }

        // Create new user
        const user = new User({
            full_name,
            email: email.toLowerCase(),
            phone,
            business_name,
            password,
            role: role || 'Sales Attendant'
        });

        await user.save();

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        res.status(201).json({
            status: 'success',
            message: 'User registered successfully',
            token,
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide email and password'
            });
        }

        // Find user and select password field
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Compare passwords
        const isPasswordValid = await user.comparePassword(password);

        if (!isPasswordValid) {
            return res.status(401).json({
                status: 'error',
                message: 'Invalid email or password'
            });
        }

        // Check if user is active
        if (!user.is_active) {
            return res.status(403).json({
                status: 'error',
                message: 'This account has been deactivated'
            });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                user_id: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production',
            { expiresIn: process.env.JWT_EXPIRY || '7d' }
        );

        res.json({
            status: 'success',
            message: 'Login successful',
            token,
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                business_name: user.business_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get current user
router.get('/me', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.user.user_id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            user: {
                user_id: user._id,
                full_name: user.full_name,
                email: user.email,
                phone: user.phone,
                business_name: user.business_name,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
