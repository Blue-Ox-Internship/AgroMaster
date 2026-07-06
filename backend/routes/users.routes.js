const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticate, authorize } = require('../middleware/auth');
const { userRules, userUpdateRules, idParamRule } = require('../middleware/validate');
const User = require('../models/User');
const supabaseClient = require('../supabase/client');
const fallbackStore = require('../config/fallback-store');

const router = express.Router();
const supabaseConfigured = Boolean(
    supabaseClient
    && supabaseClient.from
    && supabaseClient.supabaseUrl
    && (supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey)
    && !String(supabaseClient.supabaseServiceRoleKey || supabaseClient.supabaseAnonKey).includes('replace_with')
);

// Get all users (Admin only)
router.get('/', authenticate, authorize('Administrator'), async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('users').select('id, full_name, email, phone, business_name, role, is_active, created_at, updated_at').order('created_at', { ascending: false });
            if (error) throw error;
            return res.json({ status: 'success', count: (data || []).length, users: data || [] });
        }

        if (!req.app.locals.dbConnected) {
            const users = fallbackStore.listItems('users').map(({ password, ...user }) => user);
            return res.json({ status: 'success', count: users.length, users });
        }

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
router.get('/:id', authenticate, idParamRule, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('users').select('id, full_name, email, phone, business_name, role, is_active, created_at, updated_at').eq('id', req.params.id).maybeSingle();
            if (error) throw error;
            if (!data) {
                return res.status(404).json({ status: 'error', message: 'User not found' });
            }
            return res.json({ status: 'success', user: data });
        }

        if (!req.app.locals.dbConnected) {
            const user = fallbackStore.getItem('users', req.params.id);
            if (!user) {
                return res.status(404).json({ status: 'error', message: 'User not found' });
            }
            const { password, ...safeUser } = user;
            return res.json({ status: 'success', user: safeUser });
        }

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
router.post('/', authenticate, authorize('Administrator'), userRules, async (req, res) => {
    try {
        const { full_name, email, phone, business_name, password, role } = req.body;

        if (!full_name || !email || !password) {
            return res.status(400).json({
                status: 'error',
                message: 'Please provide full name, email, and password'
            });
        }

        if (supabaseConfigured) {
            const { data: existingUsers, error: existingError } = await supabaseClient.from('users').select('id').eq('email', String(email).toLowerCase());
            if (existingError) throw existingError;
            if (existingUsers && existingUsers.length > 0) {
                return res.status(409).json({ status: 'error', message: 'Email already registered' });
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const { data, error } = await supabaseClient.from('users').insert({
                full_name,
                email: String(email).toLowerCase(),
                phone,
                business_name,
                password_hash: passwordHash,
                role: role || 'Sales Attendant',
                is_active: true
            }).select('id, full_name, email, role').single();

            if (error) throw error;
            return res.status(201).json({ status: 'success', message: 'User created successfully', user: { user_id: data.id, full_name: data.full_name, email: data.email, role: data.role } });
        }

        if (!req.app.locals.dbConnected) {
            const existingUser = fallbackStore.listItems('users').find((user) => user.email.toLowerCase() === String(email).toLowerCase());
            if (existingUser) {
                return res.status(409).json({ status: 'error', message: 'Email already registered' });
            }

            const user = fallbackStore.createItem('users', {
                full_name,
                email: String(email).toLowerCase(),
                phone,
                business_name,
                password,
                role: role || 'Sales Attendant'
            });
            return res.status(201).json({ status: 'success', message: 'User created successfully', user: { user_id: user.user_id, full_name: user.full_name, email: user.email, role: user.role } });
        }

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
router.put('/:id', authenticate, idParamRule, userUpdateRules, async (req, res) => {
    try {
        const { full_name, email, phone, business_name, role } = req.body;

        if (req.user.user_id !== req.params.id && req.user.role !== 'Administrator') {
            return res.status(403).json({
                status: 'error',
                message: 'You do not have permission to update this user'
            });
        }

        const updateData = { full_name, email, phone, business_name };

        if (req.user.role === 'Administrator' && role) {
            updateData.role = role;
        }

        if (supabaseConfigured) {
            const { data, error } = await supabaseClient.from('users').update({ ...updateData, updated_at: new Date().toISOString() }).eq('id', req.params.id).select('id, full_name, email, phone, business_name, role, is_active').single();
            if (error) throw error;
            return res.json({ status: 'success', message: 'User updated successfully', user: data });
        }

        if (!req.app.locals.dbConnected) {
            const user = fallbackStore.updateItem('users', req.params.id, updateData);
            if (!user) {
                return res.status(404).json({ status: 'error', message: 'User not found' });
            }
            const { password, ...safeUser } = user;
            return res.json({ status: 'success', message: 'User updated successfully', user: safeUser });
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
router.delete('/:id', authenticate, authorize('Administrator'), idParamRule, async (req, res) => {
    try {
        if (supabaseConfigured) {
            const { error } = await supabaseClient.from('users').delete().eq('id', req.params.id);
            if (error) throw error;
            return res.json({ status: 'success', message: 'User deleted successfully' });
        }

        if (!req.app.locals.dbConnected) {
            const deleted = fallbackStore.deleteItem('users', req.params.id);
            return res.json({ status: 'success', message: deleted ? 'User deleted successfully' : 'User not found' });
        }

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
