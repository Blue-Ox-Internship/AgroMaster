const express = require('express');
const { authenticate, authorize } = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

// Get all users (Admin only)
router.get('/', authenticate, authorize('Administrator'), async (req, res) => {
    try {
        const users = await User.find({}).select('-password').sort({ created_at: -1 });

        res.json({
            status: 'success',
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Get user by ID (Admin or own user)
router.get('/:id', authenticate, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Create new user (Admin only)
router.post('/', authenticate, authorize('Administrator'), async (req, res) => {
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

        const user = new User({
            full_name,
            email: email.toLowerCase(),
            phone,
            business_name,
            password,
            role: role || 'Sales Attendant'
        });

        await user.save();

        res.status(201).json({
            status: 'success',
            message: 'User created successfully',
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

// Update user (Admin or own user)
router.put('/:id', authenticate, async (req, res) => {
    try {
        const { full_name, email, phone, business_name, role } = req.body;

        // Check authorization
        if (req.user.user_id !== req.params.id && req.user.role !== 'Administrator') {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to update this user'
            });
        }

        const updateData = { full_name, email, phone, business_name };

        // Only admin can change roles
        if (req.user.role === 'Administrator' && role) {
            updateData.role = role;
        }

        const user = await User.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

// Delete user (Admin only)
router.delete('/:id', authenticate, authorize('Administrator'), async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({
                status: 'error',
                message: 'User not found'
            });
        }

        res.json({
            status: 'success',
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            status: 'error',
            message: error.message
        });
    }
});

module.exports = router;
